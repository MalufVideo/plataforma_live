const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Create admin user
  const adminPassword = await bcrypt.hash('admin123', 12);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@livevideo.com.br' },
    update: {},
    create: {
      email: 'admin@livevideo.com.br',
      password: adminPassword,
      name: 'Admin',
      role: 'ADMIN',
      company: 'Live Video',
      title: 'System Administrator'
    }
  });
  console.log('Created admin user:', admin.email);

  // Create demo moderator
  const modPassword = await bcrypt.hash('moderator123', 12);
  const moderator = await prisma.user.upsert({
    where: { email: 'moderator@livevideo.com.br' },
    update: {},
    create: {
      email: 'moderator@livevideo.com.br',
      password: modPassword,
      name: 'Moderator',
      role: 'MODERATOR',
      company: 'Live Video',
      title: 'Event Moderator'
    }
  });
  console.log('Created moderator user:', moderator.email);

  // Create demo attendee
  const attendeePassword = await bcrypt.hash('attendee123', 12);
  const attendee = await prisma.user.upsert({
    where: { email: 'attendee@example.com' },
    update: {},
    create: {
      email: 'attendee@example.com',
      password: attendeePassword,
      name: 'Demo Attendee',
      role: 'ATTENDEE',
      company: 'Demo Company',
      title: 'Viewer'
    }
  });
  console.log('Created attendee user:', attendee.email);

  // Create demo event
  const now = new Date();
  const eventStart = new Date(now.getTime() + 24 * 60 * 60 * 1000); // Tomorrow
  const eventEnd = new Date(eventStart.getTime() + 4 * 60 * 60 * 1000); // 4 hours later

  const event = await prisma.event.upsert({
    where: { slug: 'demo-event-2024' },
    update: {},
    create: {
      title: 'Demo Live Event 2024',
      description: 'A demonstration event for the Live Video platform',
      slug: 'demo-event-2024',
      startTime: eventStart,
      endTime: eventEnd,
      timezone: 'America/Sao_Paulo',
      status: 'SCHEDULED',
      isPublic: true,
      requiresAuth: true,
      primaryColor: '#6366f1'
    }
  });
  console.log('Created demo event:', event.title);

  // Create demo session
  const session = await prisma.eventSession.upsert({
    where: { id: 'demo-session-1' },
    update: {},
    create: {
      id: 'demo-session-1',
      eventId: event.id,
      title: 'Opening Keynote',
      description: 'Welcome and introduction to the event',
      speaker: 'John Doe',
      startTime: eventStart,
      endTime: new Date(eventStart.getTime() + 60 * 60 * 1000) // 1 hour
    }
  });
  console.log('Created demo session:', session.title);

  // Create demo stream
  const stream = await prisma.stream.upsert({
    where: { streamKey: 'demo_stream_key_12345' },
    update: {},
    create: {
      eventId: event.id,
      sessionId: session.id,
      createdById: admin.id,
      name: 'Main Stage Stream',
      streamKey: 'demo_stream_key_12345',
      rtmpUrl: 'rtmp://localhost:1935/live/demo_stream_key_12345',
      hlsUrl: 'http://localhost:8080/hls/demo_stream_key_12345/master.m3u8',
      playbackUrl: 'http://localhost:8080/hls/demo_stream_key_12345/master.m3u8',
      source: 'RTMP',
      status: 'IDLE'
    }
  });
  console.log('Created demo stream:', stream.name);

  console.log('Seeding completed!');
  console.log('\nDemo Credentials:');
  console.log('Admin: admin@livevideo.com.br / admin123');
  console.log('Moderator: moderator@livevideo.com.br / moderator123');
  console.log('Attendee: attendee@example.com / attendee123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
