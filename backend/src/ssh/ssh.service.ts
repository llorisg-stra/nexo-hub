import { Injectable, Logger } from '@nestjs/common';
import { NodeSSH, SSHExecCommandResponse } from 'node-ssh';

export interface SshConnectionConfig {
    host: string;
    username: string;
    privateKeyPath?: string;
    password?: string;
    port?: number;
}

export interface SshExecResult {
    stdout: string;
    stderr: string;
    code: number | null;
    success: boolean;
}

@Injectable()
export class SshService {
    private readonly logger = new Logger(SshService.name);

    /**
     * Build the connection options for NodeSSH.
     * Supports both key-based and password-based auth.
     */
    private buildConnectOptions(config: SshConnectionConfig): Record<string, any> {
        const opts: Record<string, any> = {
            host: config.host,
            username: config.username,
            port: config.port ?? 22,
            readyTimeout: 10_000,
        };
        if (config.password) {
            opts.password = config.password;
        } else if (config.privateKeyPath) {
            opts.privateKeyPath = config.privateKeyPath;
        }
        return opts;
    }

    /**
     * Execute a command on a remote VPS via SSH.
     */
    async exec(
        config: SshConnectionConfig,
        command: string,
        cwd?: string,
    ): Promise<SshExecResult> {
        const ssh = new NodeSSH();
        try {
            await ssh.connect(this.buildConnectOptions(config));

            this.logger.log(`[SSH ${config.host}] Executing: ${command}`);

            const result: SSHExecCommandResponse = await ssh.execCommand(command, {
                cwd,
                execOptions: { pty: false },
            });

            const success = result.code === 0 || result.code === null;

            if (!success) {
                this.logger.warn(
                    `[SSH ${config.host}] Command failed (code ${result.code}): ${result.stderr}`,
                );
            }

            return {
                stdout: result.stdout,
                stderr: result.stderr,
                code: result.code,
                success,
            };
        } finally {
            ssh.dispose();
        }
    }

    /**
     * Execute multiple commands sequentially.
     */
    async execMultiple(
        config: SshConnectionConfig,
        commands: string[],
        cwd?: string,
    ): Promise<SshExecResult[]> {
        const results: SshExecResult[] = [];
        for (const cmd of commands) {
            const result = await this.exec(config, cmd, cwd);
            results.push(result);
            if (!result.success) break; // Stop on first failure
        }
        return results;
    }

    /**
     * Upload a file to the remote VPS.
     */
    async uploadFile(
        config: SshConnectionConfig,
        localPath: string,
        remotePath: string,
    ): Promise<void> {
        const ssh = new NodeSSH();
        try {
            await ssh.connect(this.buildConnectOptions(config));

            await ssh.putFile(localPath, remotePath);
            this.logger.log(
                `[SSH ${config.host}] Uploaded ${localPath} → ${remotePath}`,
            );
        } finally {
            ssh.dispose();
        }
    }

    /**
     * Upload string content as a file to the remote VPS.
     */
    async uploadContent(
        config: SshConnectionConfig,
        content: string,
        remotePath: string,
    ): Promise<void> {
        // Write content via stdin redirect
        const escapedContent = content.replace(/'/g, "'\\''");
        await this.exec(
            config,
            `echo '${escapedContent}' > ${remotePath}`,
        );
    }

    /**
     * Test SSH connectivity to a VPS.
     */
    async testConnection(config: SshConnectionConfig): Promise<boolean> {
        try {
            const result = await this.exec(config, 'echo "OK"');
            return result.success && result.stdout.trim() === 'OK';
        } catch {
            return false;
        }
    }
}
