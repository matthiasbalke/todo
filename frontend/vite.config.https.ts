import { mergeConfig } from 'vite';
import baseConfig from './vite.config';
import fs from 'fs';

// Local HTTPS dev server for testing on physical devices (e.g. iPhone passkey testing).
// Requires .certs/key.pem and .certs/cert.pem — generate with:
//   mkcert -key-file ../.certs/key.pem -cert-file ../.certs/cert.pem localhost 127.0.0.1 <LAN_IP> <domainName>
// See docs/dev-https-mkcert-iphone.md for full setup instructions.
export default mergeConfig(baseConfig, {
	server: {
		https: {
			key: fs.readFileSync('../.certs/key.pem'),
			cert: fs.readFileSync('../.certs/cert.pem'),
		},
		host: '0.0.0.0',   // listen on all interfaces so the iPhone can reach it
		port: 5173
	},
});
