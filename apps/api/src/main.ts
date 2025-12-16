import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import helmet from 'helmet';
import { AuditInterceptor } from './interceptors/audit.interceptor';

async function bootstrap() {
	const app = await NestFactory.create(AppModule, { cors: true });
	app.use(helmet());
	app.enableCors({
		origin: process.env.WEB_ORIGIN || true,
		credentials: true
	});

	app.useGlobalPipes(
		new ValidationPipe({
			whitelist: true,
			forbidNonWhitelisted: true,
			transform: true
		})
	);

	// Global audit interceptor for mutating requests
	app.useGlobalInterceptors(app.get(AuditInterceptor));

	const config = new DocumentBuilder()
		.setTitle('ITSQ BidOps API')
		.setDescription('REST API for BidOps')
		.setVersion('0.1.0')
		.build();
	const document = SwaggerModule.createDocument(app, config);
	SwaggerModule.setup('/docs', app, document);

	const port = process.env.PORT || 3000;
	await app.listen(port as number);
	// eslint-disable-next-line no-console
	console.log(`API listening on http://localhost:${port}`);
}

bootstrap();


