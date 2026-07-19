import fs from 'fs';
import https from 'https';

const url = 'https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=upi://pay?pa=basithmuqeeth-1@okhdfcbank%26pn=Basith%20Muqeeth%26cu=INR';
const outputPath = './assets/support-upi-qr.png';

console.log('Downloading UPI QR code...');

https.get(url, (response) => {
  if (response.statusCode !== 200) {
    console.error(`Failed to download QR code: HTTP ${response.statusCode}`);
    process.exit(1);
  }

  const fileStream = fs.createWriteStream(outputPath);
  response.pipe(fileStream);

  fileStream.on('finish', () => {
    fileStream.close();
    console.log('Successfully saved UPI QR code to assets/support-upi-qr.png');
    process.exit(0);
  });
}).on('error', (err) => {
  console.error(`Error downloading QR code: ${err.message}`);
  process.exit(1);
});
