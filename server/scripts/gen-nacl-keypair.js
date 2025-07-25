import nacl from 'tweetnacl';
import fs from 'fs';

const keypair = nacl.box.keyPair();
fs.writeFileSync('./secrets/nacl-keypair.json', JSON.stringify(Array.from(keypair.secretKey)));
fs.writeFileSync('./secrets/nacl-public-key.txt', Buffer.from(keypair.publicKey).toString('base64'));

console.log('✅ NaCl keypair saved to ./secrets/');
