const express = require('express');
const fu = require('express-fileupload');
const app = express();
const Usuario = require('../models/usuario');
const Producto = require('../models/producto');
const fs = require('fs');
const path = require('path');

app.use(fu({ useTempFiles: true }));

app.put('/upload/:tipo/:id', (req, res) => {

    let tipo = req.params.tipo;
    let id = req.params.id;

    if (!req.files)
        return res.status(400).json({ ok: false, err: { message: 'No hay archivos que enviar.' } });

    // Valida Tipo

    let tiposValidos = ['productos', 'usuarios'];
    if (tiposValidos.indexOf(tipo) < 0) res.status(400).json({ ok: false, err: { message: `Los tipos Permitidos son ${tiposValidos}.` } });

    let file = req.files.archivo;
    let nombreDividido = file.name.split('.');
    let extension = nombreDividido[nombreDividido.length - 1];
    // Extenciones Permitidas
    let extensionesValidas = ['png', 'jpg', 'jpeg'];

    if (extensionesValidas.indexOf(extension) < 0) res.status(400).json({ ok: false, err: { message: `Las extensiones validas son ${extensionesValidas}` } });

    // Cambiar nombre al archivo
    let nombreArchivo = `${ id }-${ new Date().getTime()}.${ extension }`

    file.mv(`uploads/${tipo}/${nombreArchivo}`, (err) => {
        if (err)
            return res.status(500).json({ ok: false, err });

        imagenUsuario(res, id, nombreArchivo);
        //return res.json({ ok: true, message: 'Imagen enviada correctamente.' });
    })
});

function imagenUsuario(res, id, nombreArchivo) {
    Usuario.findById(id, (err, usuario) => {

        if (err) {
            borraArchivo(nombreArchivo, 'usuarios');
            return res.status(500).json({ ok: false, err });
        }

        if (!usuario) {
            return res.status(400).json({ ok: false, err: { message: 'El usuario no existe' } });
        }

        borraArchivo(usuario.img, 'usuarios');

        usuario.img = nombreArchivo;

        usuario.save((err, usuario) => {
            res.json({
                ok: true,
                usuario,
                img: nombreArchivo
            });
        });
    });
}

function imagenProducto(res, id, nombreArchivo) {
    Producto.findById(id, (err, producto) => {
        if (err) {
            borraArchivo(nombreArchivo, 'productos');
            return res.status(500).json({ ok: false, err });
        }

        if (!producto) {
            return res.status(400).json({ ok: false, err: { message: 'El producto no existe' } })
        }

        borraArchivo(producto.img);

        producto.img = nombreArchivo;

        producto.save((err, producto) => {
            res.json({
                ok: true,
                producto,
                img: nombreArchivo
            });
        });
    });
}

function borraArchivo(nombreImagen, tipo) {
    let pathImg = path.resolve(__dirname, `../../uploads/${tipo}/${nombreImagen}`);

    if (fs.existsSync(pathImg)) {
        fs.unlinkSync(pathImg);
    }
}

module.exports = app;