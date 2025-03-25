const { default: makeWASocket, useMultiFileAuthState } = require('@whiskeysockets/baileys');
const qrcode = require('qrcode-terminal');
const pino = require('pino');
const Fuse = require('fuse.js');

// Banco de preguntas y respuestas
const questionBank = [
    { question: "Hola", answer: [{ text: "¡Bienvenido👋 Gracias por contactarnos. Somos 🚛TULATITUD🚛, expertos en ofrecer productos de calidad y un servicio de transporte confiable para que lleguen a donde los necesites. Nuestro compromiso es tu satisfacción. Estamos aquí para ayudarte en todo lo que necesites, así que no dudes en escribirnos. 🚛✨" }] },
    { question: "¿Qué puedes hacer?", answer: [{ text: "Puedo responder preguntas, ayudarte con tareas y mucho más." }] },
    { 
        question: "que nos dedicamos", 
        answer: [{ text: `Brindar servicios de transportación de carga confiable y eficiente. 
        Actualmente, nos estamos proyectando para complementar nuestra oferta con la comercialización 
        de productos de alta demanda, empezando por la sal como nuestro primer paso estratégico.

++++Si el cliente pregunta por otros productos, mencionar que la expansión será gradual y basada en demanda 
del mercado (ej: "¿Qué otros productos le interesarían a futuro?").++++S """, """En TULATITUD nos especializamos en transporte de carga terrestre, garantizando:
✔️ Entregas seguras y puntuales.
✔️ Cobertura nacional.
✔️ Profesionalidad en el servicio.

🌟 Además, estamos desarrollando un nuevo proyecto:
Como parte de nuestra mejora continua, ofrecemos suministro de sal de alta calidad🧂 (ideal para industria \
alimentaria y la cocina cubana), con la misma seriedad y eficiencia que nos caracteriza. `}] }, 
            
    { 
        question: "beneficios agregados de nuestro producto", 
        answer: [
            { text: ` La primera ventaja es única: nuestros sacos retractilados están diseñados para que usted ahorre tiempo y dinero. 
•   Almacena hasta un 30% más en el mismo espacio (por su forma compacta).
•   Cero pérdidas por contaminación (protege contra suciedad y plagas).
•   Aumenta la percepción de calidad: lo que aumenta las ventas
______________
Segundo punto clave: el transporte es 100%  gratis. Imagínese: Cero costos de transportación.______________
PERO También tenemos certifico de calidad. ¿Recuerda el escándalo de la sal de Nitro que salió en el noticiero …? 
Nosotros tenemos clientes Que le compraban a productores q lo q hacían era moler piedras de sal q compraban en la salina y esa sal molida la empaquetaban y la vendían. Por supuesto q tenían mejores precios, pero arriesgando la salud del consumidor y la integridad del negocio del cliente por el riesgo de verse involucrados en demandas por intoxicación.
Después del evento de la sal de nitro esos negocios se hicieron clientes nuestros` }, 
            { text: `✅ BENEFICIO 1: ENVASE RETRACTILADO PREMIUM
🔹 Mejor manipulación: Sacos fáciles de transportar y apilar → Ahorras 30% porciento de espacio en almacén.
🔹 Conservación óptima: Cero humedad → Evitas pérdidas por sal apelmazada.
🔹 Impresión de calidad: Presentación profesional → Tus clientes pagan más por un producto premium.


🚚 BENEFICIO 2: TRANSPORTE INCLUIDO
🔹 Sin costos ocultos: Llevamos la sal a tu negocio → Ahorras por viaje vs otros proveedores.


📜 BENEFICIO 3: CALIDAD CERTIFICADA
🔹 Sal 100% yodada: Cumple normas sanitarias → Vendes con tranquilidad (0 reclamos).
🔹 Certificado de calidad:  Tranquilidad en la venta y aumento en la confianza del cliente ` }] },
    { 
        question: "Solo Vendemos sal", 
        answer: [
            { text: "¡ARGUMENTO" }, 
            { text: "Nuestra estrategia es clara: Creemos q la  especialización es la clave para liderar el mercado. Nos enfocamos\
     en un solo producto y trabajamos para ser los mejores en su comercialización, luego repetiremos el método con otro producto. Esto nos permite optimizar \
     la logística, garantizar un suministro constante y ofrecer los mejores precios sin comprometer la calidad.  " },
            { text: "PLANTILLA DE WHATSAPP" },
            { text: `¿POR QUÉ NOS ESPECIALIZAMOS EN SAL?🧂 
      
      
Hola [Nombre del cliente],  

En TULATITUD creemos que la excelencia nace de la especialización. 
Por eso, hoy nos enfocamos al 100 porciento en ser los mejores en distribución de sal, y te explicamos por qué esto 
te beneficia:  

---

✅ VENTAJAS PARA TI:  
1️⃣ ⏱️ Logística perfecta: 

   - Rutas optimizadas → Entregas más rápidas.  
   - Menos errores → Tu pedido siempre llega completo.  


2️⃣ 💰 Mejor precio garantizado: 
   - Al comprar grandes volúmenes de un solo producto obtenemos suministros contantes y costos más bajos → Beneficios que compartimos contigo.  
---

🔮 ¿Y DESPUÉS? 
Una vez dominemos el mercado de la sal, replicaremos este modelo con otros productos. ¡Pronto tendrás más opciones con la misma eficiencia!  

---

📲 ¿Listo para probar la diferencia de trabajar con expertos?
👉 Escríbenos tu cantidad requerida y Dirección.  ` }
        ] 
    },
    {
        question: "es rentable comercializar sal",
        answer: [
            { text: "¡Aquí está la prueba!" },
            { image: "D:/work/bot/rentsal.jpeg" } // Cambia esta ruta por la ubicación de tu imagen local
        ]

    },
    {
        question: "venden con facturas",
        answer: [
            { text: "¡Aquí está la factura!" },
            { image: "facturas.jpg" } // Cambia esta ruta por la ubicación de tu imagen local
        ]
        
    }
];

// Continuar en el sistema Global-Match FLESH**
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
                qrcode.generate(qr, { small: true });
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