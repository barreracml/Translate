require('dotenv').config();
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const admin = require("firebase-admin");
const path = require("path");
const PDFDocument = require("pdfkit");
const fs = require("fs");
const serviceAccount = require("./firebase-key.json");
const nodemailer = require("nodemailer");
const os = require('os');
const axios = require('axios');
const pdfParse = require('pdf-parse')
const stripe = require('stripe')('');
const DEEPL_API_KEY = "";
const DEEPL_URL = "https://api-free.deepl.com/v2/translate";


admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

const app = express();
app.use(cors());
app.use(bodyParser.json());

app.use(express.static(path.join(__dirname, "../public")));

//hace la solicitud de donde comenzara el programa
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../public", "index.html"));
});

//hace la solicitud del usuario que quiere realizar el tramite
app.post("/solicitud", async (req, res) => {
  const { nombre, email, direccion, telefono, tipoDocumento } = req.body;

  try {
    const solicitudRef = db.collection("solicitudes").add({
      nombre,
      email,
      direccion,
      telefono,
      tipoDocumento,
      fecha: new Date(),
    });

    res.json({
      success: true,
      message: "Solicitud enviada correctamente",
    });

  } catch (error) {
    console.error("Error al guardar la solicitud:", error);
    res.status(500).json({ success: false, message: "Error al guardar la solicitud", error });
  }
});

// genera el pdf de la acta  de nacimiento
app.post("/generar-pdf", async (req, res) => {
  try {
    const {
      nombreApellido, fechaNacimiento, sexo, lugarNacimiento, fechaRegistro,
      nombrePadre, nombreMadre, numeroDocumento, volumen, numeroActa,
      numeroPagina, fechaEmision, lugarEmision, paginaOrigen, nombreDocumento
    } = req.body;

    // Concatenamos el texto para traducirlo todo a la vez
    const textoOriginal = `
      Nombre y Apellido: ${nombreApellido}
      Fecha de Nacimiento: ${fechaNacimiento}
      Sexo: ${sexo}
      Lugar de Nacimiento: ${lugarNacimiento}
      Fecha de Registro: ${fechaRegistro}
      Nombre del Padre: ${nombrePadre}
      Nombre de la Madre: ${nombreMadre}
      Número de Documento: ${numeroDocumento}
      Volumen: ${volumen}
      Número de Acta: ${numeroActa}
      Número de Página: ${numeroPagina}
      Fecha de Emisión: ${fechaEmision}
      Lugar de Emisión: ${lugarEmision}
    `;

    console.log("Texto original para traducir:", textoOriginal);

    // Traducir el texto usando la API de DeepL
    console.log("Iniciando traducción...");

    const response = await axios.post(DEEPL_URL, null, {
      params: {
        auth_key: DEEPL_API_KEY,
        text: textoOriginal,
        target_lang: 'EN',
      },
    });

    const traduccion = response.data.translations[0].text;
    console.log("Texto traducido:", traduccion);

    // Ahora, creamos el PDF con el texto traducido
    const dirPath = path.join(__dirname, '../actas');
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath);
    }

    const fileName = `${nombreDocumento}.pdf`;
    const filePath = path.join(dirPath, fileName);

    const doc = new PDFDocument();
    doc.pipe(fs.createWriteStream(filePath));

    doc.fontSize(12)
      .text("Translated Birth Certificate", { underline: true })
      .moveDown(1)
      .text(traduccion);

    doc.end();

    doc.on("finish", () => {
      console.log(`PDF traducido generado: ${filePath}`);

      // Enviar respuesta una vez que el PDF se haya generado correctamente
      res.json({
        success: true,
        message: "PDF generado y traducido correctamente",
        fileName: fileName,
        filePath: filePath,
        translatedText: traduccion,
      });
    });
  } catch (error) {
    console.error("Error al generar o traducir el PDF:", error);
    res.status(500).json({ success: false, message: "Error al generar o traducir el PDF", error });
  }

  const pdfGenerado = true;
  if (pdfGenerado) {
    // Si el PDF se generó correctamente
    res.json({ success: true, message: "PDF generado con éxito" });
  } else {
    // Si hubo un error al generar el PDF
    res.json({ success: false, message: "Error al generar el PDF" });
  }
});

//genera el pdf de la acta de divorcio
app.post("/generardivorcio", async (req, res) => {
  try {
    const {
        nombreInvolucrado1, edadInvolucrado1, sexoInvolucrado1, nacionalidadInvolucrado1,
        nombreInvolucrado2, edadInvolucrado2, sexoInvolucrado2, nacionalidadInvolucrado2, fechaDisolucion,
        numeroDocumento, volumen, numeroActa, numeroPagina, fechaEmision, lugarEmision, paginaOrigen, nombreDocumento
      } = req.body;

    // Concatenamos el texto para traducirlo todo a la vez
    const textoOriginal = `
      Nombre Involucrado 1: ${nombreInvolucrado1}
      Edad Involucrado 1: ${edadInvolucrado1}
      Sexo Involucrado 1: ${sexoInvolucrado1}
      Nacionalidad Involucrado 1: ${nacionalidadInvolucrado1}
      Nombre Involucrado 2: ${nombreInvolucrado2}
      Edad Involucrado 2: ${edadInvolucrado2}
      Sexo Involucrado 2: ${sexoInvolucrado2}
      Nacionalidad Involucrado 2: ${nacionalidadInvolucrado2}
      Fecha de Disolución: ${fechaDisolucion}
      Número de Documento: ${numeroDocumento}
      Volumen: ${volumen}
      Número de Acta: ${numeroActa}
      Número de Página: ${numeroPagina}
      Fecha de Emisión: ${fechaEmision}
      Lugar de Emisión: ${lugarEmision}
    `;

    console.log("Texto original para traducir:", textoOriginal);

    // Traducir el texto usando la API de DeepL
    console.log("Iniciando traducción...");

    const response = await axios.post(DEEPL_URL, null, {
      params: {
        auth_key: DEEPL_API_KEY,
        text: textoOriginal,
        target_lang: 'EN',
      },
    });

    const traduccion = response.data.translations[0].text;
    console.log("Texto traducido:", traduccion);

    // Ahora, creamos el PDF con el texto traducido
    const dirPath = path.join(__dirname, '../actas');
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath);
    }

    const fileName = `${nombreDocumento}.pdf`;
    const filePath = path.join(dirPath, fileName);

    const doc = new PDFDocument();
    doc.pipe(fs.createWriteStream(filePath));

    doc.fontSize(12)
      .text("Translated divorce certificate", { underline: true })
      .moveDown(1)
      .text(traduccion);

    doc.end();

    doc.on("finish", () => {
      console.log(`PDF traducido generado: ${filePath}`);

      // Enviar respuesta una vez que el PDF se haya generado correctamente
      res.json({
        success: true,
        message: "PDF generado y traducido correctamente",
        fileName: fileName,
        filePath: filePath,
        translatedText: traduccion,
      });
    });
  } catch (error) {
    console.error("Error al generar o traducir el PDF:", error);
    res.status(500).json({ success: false, message: "Error al generar o traducir el PDF", error });
  }

  const pdfGenerado = true;
  if (pdfGenerado) {
    // Si el PDF se generó correctamente
    res.json({ success: true, message: "PDF generado con éxito" });
  } else {
    // Si hubo un error al generar el PDF
    res.json({ success: false, message: "Error al generar el PDF" });
  }
});

//genera el pdf de la acta defuncion
app.post("/generardefuncion", async (req, res) => {
  try {
    const {
        nombreFinado, fechaDefuncion, fechaNacimiento, sexo, edad, lugarNacimiento, numeroSS, estadoCivil,
        nombreEsposa, domicilio, nombrePadre, nombreMadre, lugarDefuncion, informacionRelacion, direccion,
        lugarSepelio, ubicacionSepelio, nombreFuneraria, direccionFuneraria, firmaCertificado, fechaCertificado,
        cedula, horaDeceso, causasMuerte, paginaOrigen, nombreDocumento
      } = req.body;

    // Concatenamos el texto para traducirlo todo a la vez
    const textoOriginal = `
      Nombre Finado: ${nombreFinado}
      Fecha de Defunción: ${fechaDefuncion}
      Fecha de Nacimiento: ${fechaNacimiento}
      Sexo: ${sexo}
      Edad: ${edad}
      Lugar de Nacimiento: ${lugarNacimiento}
      Número de SS: ${numeroSS}
      Estado Civil: ${estadoCivil}
      Nombre de la Esposa: ${nombreEsposa}
      Domicilio: ${domicilio}
      Nombre del Padre: ${nombrePadre}
      Nombre de la Madre: ${nombreMadre}
      Lugar de Defunción: ${lugarDefuncion}
      Información Relación: ${informacionRelacion}
      Dirección: ${direccion}
      Lugar de Sepelio: ${lugarSepelio}
      Ubicación del Sepelio: ${ubicacionSepelio}
      Nombre de la Funeraria: ${nombreFuneraria}
      Dirección de la Funeraria: ${direccionFuneraria}
      Firma del Certificado: ${firmaCertificado}
      Fecha del Certificado: ${fechaCertificado}
      Cédula: ${cedula}
      Hora del Deceso: ${horaDeceso}
      Causas de la Muerte: ${causasMuerte}
    `;

    console.log("Texto original para traducir:", textoOriginal);

    // Traducir el texto usando la API de DeepL
    console.log("Iniciando traducción...");

    const response = await axios.post(DEEPL_URL, null, {
      params: {
        auth_key: DEEPL_API_KEY,
        text: textoOriginal,
        target_lang: 'EN',
      },
    });

    const traduccion = response.data.translations[0].text;
    console.log("Texto traducido:", traduccion);

    // Ahora, creamos el PDF con el texto traducido
    const dirPath = path.join(__dirname, '../actas');
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath);
    }

    const fileName = `${nombreDocumento}.pdf`;
    const filePath = path.join(dirPath, fileName);

    const doc = new PDFDocument();
    doc.pipe(fs.createWriteStream(filePath));

    doc.fontSize(12)
      .text("Translated death certificate", { underline: true })
      .moveDown(1)
      .text(traduccion);

    doc.end();

    doc.on("finish", () => {
      console.log(`PDF traducido generado: ${filePath}`);

      // Enviar respuesta una vez que el PDF se haya generado correctamente
      res.json({
        success: true,
        message: "PDF generado y traducido correctamente",
        fileName: fileName,
        filePath: filePath,
        translatedText: traduccion,
      });
    });
  } catch (error) {
    console.error("Error al generar o traducir el PDF:", error);
    res.status(500).json({ success: false, message: "Error al generar o traducir el PDF", error });
  }

  const pdfGenerado = true;
  if (pdfGenerado) {
    // Si el PDF se generó correctamente
    res.json({ success: true, message: "PDF generado con éxito" });
  } else {
    // Si hubo un error al generar el PDF
    res.json({ success: false, message: "Error al generar el PDF" });
  }
});

//realiza el pago del documento
app.post('/create-checkout-session', async (req, res) => {
  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: { name: 'Trámite' },
            unit_amount: 1000, // Precio en centavos (10 USD)
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: 'http://localhost:3000/success.html',
      cancel_url: 'http://localhost:3000/cancel.html',
    });

    res.json({ id: session.id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

//crea la solcitud para hacer el pago por stripe
app.post("/create-payment-intent", async (req, res) => {
  try {
    const { amount, currency } = req.body; // Asegúrate de recibir estos valores desde el frontend

    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency,
      automatic_payment_methods: { enabled: true },
    });

    res.send({
      clientSecret: paymentIntent.client_secret,
    });
  } catch (error) {
    res.status(400).send({ error: error.message });
  }
});

//hace la descarga del pdf dependiendo que quiera hacer
app.get('/download-pdf', (req, res) => {
  // Obtener el nombre del archivo PDF desde los parámetros de la URL
  const pdfName = req.query.name;

  if (!pdfName) {
      return res.status(400).json({ success: false, message: 'Nombre del PDF no proporcionado.' });
  }

  // Construir la ruta completa del archivo
  const filePath = path.join(__dirname, "..", "actas", `${pdfName}.pdf`);

  // Verificar si el archivo existe
  const fs = require('fs');
  fs.exists(filePath, (exists) => {
      if (exists) {
          // Enviar el archivo al cliente
          res.download(filePath, `${pdfName}.pdf`, (err) => {
              if (err) {
                  console.error('Error al descargar el archivo:', err);
                  res.status(500).json({ success: false, message: 'Error al descargar el archivo.' });
              }
          });
      } else {
          res.status(404).json({ success: false, message: 'Archivo no encontrado.' });
      }
  });
});

// crea el transportador con nodemail
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
      user: 'tu correo',
      pass: 'clave'
  }
});

// hace la solicitud para el envio del pdf por nodemail
app.post('/send-pdf-email', (req, res) => {
  const { email, subject, message, pdfName } = req.body;

  // Construir la ruta completa del archivo PDF
  const filePath = path.join(__dirname, "..", "actas", `${pdfName}.pdf`);

  // Verificar si el archivo existe
  fs.exists(filePath, (exists) => {
      if (!exists) {
          return res.status(404).json({ success: false, message: 'Archivo no encontrado' });
      }

      // Configuración del correo con el archivo adjunto
      const mailOptions = {
          from: 'correo base',
          to: email,
          subject: subject || 'Correo desde tu aplicación',
          text: message || 'Hola, adjuntamos tu archivo. Si tienes dudas, contáctanos.',
          attachments: [
              {
                  path: filePath  // Ruta al archivo PDF
              }
          ]
      };

      // Enviar el correo
      transporter.sendMail(mailOptions, (error, info) => {
          if (error) {
              return res.status(500).json({ success: false, message: 'Error al enviar el correo', error });
          }
          res.json({ success: true, message: 'Correo enviado correctamente', info });
      });
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en el puerto ${PORT}`);
});
