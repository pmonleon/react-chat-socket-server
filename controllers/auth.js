const { response } = require('express');
const bcrypt       = require('bcryptjs');

const Usuario = require('../models/usuario');
const { generarJWT } = require('../helpers/jwt');

const crearUsuario = async(req, res = response) => {
    
    try {
        
        const { email, password, nombre } = req.body;

        // verificar que el email no exista
        const existeEmail = await Usuario.findOne({ email });
        if ( existeEmail ) {
            return res.status(400).json({
                ok: false,
                msg: 'El correo ya existe'
            });
        }

        const usuario = new Usuario( { email, password, nombre } );
       
        // Encriptar contraseña
        const salt = bcrypt.genSaltSync(10);
        usuario.password = bcrypt.hashSync( password, 10 );

        // Guardar usuario en BD
       await usuario.save();
       
        
        // Generar el JWT
        const token = await generarJWT( usuario.id );
        

        res.json({
            ok: true,
            usuario,
            token
        });



    } catch (error) {
        console.log(error);
        res.status(500).json({
            ok: false,
            msg: 'Hable con el administrador'
        });
    }

    
}


// login
const login = async(req, res) => {

    const {  email, password } = req.body;

    try {
        
        // Verificar si existe el correo
        const usuarioDB = await Usuario.findOne({ email });
        if ( !usuarioDB ) {
            return res.status(404).json({
                ok: false,
                msg: 'Email no encontrado'
            });
        }

        // Validar el password
        const validPassword = bcrypt.compareSync( password, usuarioDB.password );
        console.log({validPassword, pass: usuarioDB.password, passN: password})
        if ( !validPassword ) {
            return res.status(404).json({
                ok: false,
                msg: 'Password no es correcto'
            });
        }

        // Generar el JWT
        const token = await generarJWT( usuarioDB.id );


        res.json({
            ok: true,
            usuario: usuarioDB,
            token
        });


    } catch (error) {
        console.log(error);
        res.status(500).json({
            ok: false,
            msg: 'Hable con el administrador'
        });
    }

}


// renewToken
const renewToken = async(req, res) => {

    const uid = req.uid;

    // Generar un nuevo JWT
    const token = await generarJWT( uid );

    // Obtener el usuario por UID
    const usuario = await Usuario.findById( uid );

    res.json({
        ok: true,
        usuario,
        token,
    })
}

module.exports = {
    crearUsuario,
    login,
    renewToken
}
