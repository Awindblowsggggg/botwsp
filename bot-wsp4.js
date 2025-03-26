const { default: makeWASocket, useMultiFileAuthState } = require('@whiskeysockets/baileys');
const qrcode = require('qrcode-terminal');
const QRCode = require('qrcode'); // Importa la librería QRCode para impresión cuadrada
const pino = require('pino');
const Fuse = require('fuse.js');
const crypto = require('crypto');
const fs = require('fs'); // Manejo de archivos

// Banco de preguntas y respuestas (sin cambios en esta sección)
const questionBank = [ /* ...Tu Banco de Preguntas... */ ];

// Configuración de similitud
const fuse = new Fuse(questionBank, {
    keys: ['question'],
    threshold: 0.4,
});

// Función para buscar la mejor coincidencia
const findClosestMatch = (input) => {
    const result = fuse.search(input);
    return result.length > 0 ? result[0].item.answer : [{ text: "Lo siento, no tengo una respuesta para eso." }];
};

// Retraso para control de frecuencia
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Procesar la cola de mensajes
const processQueue = async (sock, recipient, messages) => {
    for (const message of messages) {
        try {
            if (message.text) {
                await sock.sendMessage(recipient, { text: message.text });
                console.log(`Mensaje enviado: ${message.text}`);
            }
            if (message.image) {
                await sock.sendMessage(recipient, { image: { url: message.image } });
                console.log(`Imagen enviada: ${message.image}`);
            }
        } catch (err) {
            console.error('Error al enviar el mensaje:', err);
        }
        await delay(1000); // Agrega un retraso de 1 segundo entre mensajes
    }
};

// Función principal
const startBot = async () => {
    try {
        const { state, saveCreds } = await useMultiFileAuthState('./auth_info');
        const sock = makeWASocket({
            logger: pino({ level: 'debug' }),
            auth: state,
        });

        sock.ev.on('creds.update', saveCreds);

        sock.ev.on('connection.update', (update) => {
            const { connection, lastDisconnect, qr } = update;

            if (qr) {
                console.log('Escanea este código QR para conectar el bot:');
                
                // Generar el QR en formato cuadrado para consola
                QRCode.toString(qr, { type: 'terminal' }, (err, qrCode) => {
                    if (err) {
                        console.error('Error al generar el código QR:', err);
                    } else {
                        console.log(qrCode); // Esto imprime el QR en formato cuadrado en la consola
                    }
                });

                // Generar el QR como archivo PNG
                QRCode.toFile('./qr.png', qr, (err) => {
                    if (err) {
                        console.error('Error al guardar el código QR como imagen:', err);
                    } else {
                        console.log('Código QR guardado como archivo qr.png');
                    }
                });
            }

            if (connection === 'open') {
                console.log('¡Bot conectado exitosamente!');
            } else if (connection === 'close') {
                const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== 401;
                if (shouldReconnect) {
                    setTimeout(() => startBot(), 5000);
                } else {
                    console.log('Error crítico: Limpia las credenciales y vuelve a intentarlo.');
                }
            }
        });

        // Manejo de mensajes
        sock.ev.on('messages.upsert', async (msg) => {
            if (msg.messages && msg.messages[0]) {
                const message = msg.messages[0];
                if (message.key.fromMe) {
                    console.log('Mensaje enviado por el bot. Ignorando...');
                    return;
                }

                const sender = message.key.remoteJid;
                const isGroup = sender.endsWith('@g.us'); // Verificar si el mensaje proviene de un grupo

                if (isGroup) {
                    console.log('Mensaje proveniente de un grupo. Ignorando...');
                    return; // No procesar mensajes de grupos
                }

                const messageContent = message.message?.conversation || '';
                console.log(`Mensaje de ${sender}: ${messageContent}`);

                // Encuentra la respuesta más cercana
                const responses = findClosestMatch(messageContent);

                // Envía los mensajes (texto e imágenes)
                await processQueue(sock, sender, responses);
            }
        });
    } catch (err) {
        console.error('Error al iniciar el bot:', err);
    }
};

startBot();
