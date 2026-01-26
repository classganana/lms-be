import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { UsersService } from '../src/users/users.service';
import * as bcrypt from 'bcrypt';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const usersService = app.get(UsersService);

  const adminEmail = process.env.ADMIN_EMAIL || 'admin@lms.com';
  const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@123';
  const adminName = process.env.ADMIN_NAME || 'Admin User';
  const adminMobile = process.env.ADMIN_MOBILE || '1234567890';

  try {
    // Check if admin already exists
    const existingAdmin = await usersService.findByEmail(adminEmail);
    if (existingAdmin) {
      console.log('✅ Admin user already exists:', adminEmail);
      console.log('   Role:', existingAdmin.role);
      await app.close();
      return;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(adminPassword, 10);

    // Create admin user
    const admin = await usersService.create({
      name: adminName,
      email: adminEmail,
      mobile: adminMobile,
      password: hashedPassword,
      role: 'ADMIN',
      isActive: true,
    });

    console.log('✅ Admin user created successfully!');
    console.log('   Email:', admin.email);
    console.log('   Name:', admin.name);
    console.log('   Role:', admin.role);
    console.log('\n📝 Default credentials:');
    console.log('   Email:', adminEmail);
    console.log('   Password:', adminPassword);
    console.log('\n⚠️  Please change the password after first login!');
  } catch (error) {
    console.error('❌ Error creating admin user:', error.message);
    if (error.code === 11000) {
      console.error('   Email already exists in database');
    }
  } finally {
    await app.close();
  }
}

bootstrap();
