/**
 * Seed script: populate PackageCatalog with core extensions.
 * Run: npx tsx prisma/seed-packages.ts
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const packages = [
    // ── Channels ──
    {
        name: 'channel-webchat',
        displayName: 'WebChat',
        type: 'CHANNEL' as const,
        description: 'Widget de chat web embebible con Socket.IO en tiempo real',
        icon: '💬',
        repoUrl: 'https://github.com/llorisg-stra/channel-webchat',
        category: 'comunicacion',
        isCore: true,
    },
    {
        name: 'channel-whatsapp',
        displayName: 'WhatsApp',
        type: 'CHANNEL' as const,
        description: 'Canal de WhatsApp Business API (Cloud API)',
        icon: '📱',
        repoUrl: 'https://github.com/llorisg-stra/channel-whatsapp',
        category: 'comunicacion',
        isCore: true,
    },
    {
        name: 'channel-telegram',
        displayName: 'Telegram',
        type: 'CHANNEL' as const,
        description: 'Bot de Telegram con soporte para comandos y mensajes',
        icon: '✈️',
        repoUrl: 'https://github.com/llorisg-stra/channel-telegram',
        category: 'comunicacion',
        isCore: false,
    },
    {
        name: 'channel-email',
        displayName: 'Email',
        type: 'CHANNEL' as const,
        description: 'Canal de email con IMAP/SMTP y templates HTML',
        icon: '📧',
        repoUrl: 'https://github.com/llorisg-stra/channel-email',
        category: 'comunicacion',
        isCore: false,
    },
    // ── Connectors ──
    {
        name: 'connector-google-calendar',
        displayName: 'Google Calendar',
        type: 'CONNECTOR' as const,
        description: 'Integración con Google Calendar para citas y eventos',
        icon: '📅',
        repoUrl: 'https://github.com/llorisg-stra/connector-google-calendar',
        category: 'integraciones',
        isCore: false,
    },
    {
        name: 'connector-hubspot',
        displayName: 'HubSpot CRM',
        type: 'CONNECTOR' as const,
        description: 'Sincronización bidireccional con HubSpot CRM',
        icon: '🔗',
        repoUrl: 'https://github.com/llorisg-stra/connector-hubspot',
        category: 'integraciones',
        isCore: false,
    },
    {
        name: 'connector-stripe',
        displayName: 'Stripe Payments',
        type: 'CONNECTOR' as const,
        description: 'Procesamiento de pagos y suscripciones con Stripe',
        icon: '💳',
        repoUrl: 'https://github.com/llorisg-stra/connector-stripe',
        category: 'integraciones',
        isCore: false,
    },
    // ── Modules ──
    {
        name: 'module-lamadrid',
        displayName: 'Grupo Lamadrid (Textil)',
        type: 'MODULE' as const,
        description: 'Módulo B2B/B2C para industria textil: catálogo, stock, leads, visualización IA',
        icon: '🧵',
        repoUrl: 'https://github.com/llorisg-stra/module-lamadrid',
        category: 'ventas',
        isCore: false,
    },
    {
        name: 'module-crm-inmobiliaria',
        displayName: 'CRM Inmobiliario',
        type: 'MODULE' as const,
        description: 'CRM completo para agencias inmobiliarias: captación, cruces, operaciones',
        icon: '🏠',
        repoUrl: 'https://github.com/llorisg-stra/module-crm-inmobiliaria',
        category: 'ventas',
        isCore: false,
    },
    // ── Plugins ──
    {
        name: 'plugin-echo-agent',
        displayName: 'Echo Agent Pro',
        type: 'PLUGIN' as const,
        description: 'Agente de demostración que repite mensajes con metadata enriquecida',
        icon: '🔊',
        repoUrl: 'https://github.com/llorisg-stra/plugin-echo-agent',
        category: 'utilidades',
        isCore: false,
    },
    // ── Skills ──
    {
        name: 'skill-lead-qualification',
        displayName: 'Cualificación de Leads',
        type: 'SKILL' as const,
        description: 'Skill IA para cualificar leads automáticamente con scoring multi-factor',
        icon: '🎯',
        repoUrl: 'https://github.com/llorisg-stra/skill-lead-qualification',
        category: 'ventas',
        isCore: false,
    },
    {
        name: 'skill-appointment-booking',
        displayName: 'Reserva de Citas',
        type: 'SKILL' as const,
        description: 'Gestión inteligente de reservas con integración de calendarios',
        icon: '📋',
        repoUrl: 'https://github.com/llorisg-stra/skill-appointment-booking',
        category: 'operaciones',
        isCore: false,
    },
];

async function main() {
    console.log('🌱 Seeding PackageCatalog...\n');

    for (const pkg of packages) {
        const existing = await prisma.packageCatalog.findUnique({
            where: { name: pkg.name },
        });

        if (existing) {
            console.log(`  ⏭️  ${pkg.name} (already exists)`);
            continue;
        }

        await prisma.packageCatalog.create({ data: pkg });
        console.log(`  ✅ ${pkg.displayName} (${pkg.type})`);
    }

    const total = await prisma.packageCatalog.count();
    console.log(`\n📦 Total packages in catalog: ${total}`);
}

main()
    .catch((e) => {
        console.error('❌ Seed failed:', e);
        process.exit(1);
    })
    .finally(() => prisma.$disconnect());
