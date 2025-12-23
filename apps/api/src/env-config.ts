import { config } from 'dotenv';
import { resolve } from 'node:path';

config({
	path: process.env.DOTENV_CONFIG_PATH || resolve(__dirname, '../../.env'),
	override: false
});
