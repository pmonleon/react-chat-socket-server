const { comprobarJWT } = require('../helpers/jwt');
const { 
    usuarioConectado, 
    usuarioDesconectado,
    grabarMensaje,
    getUsuarios,
} = require('../controllers/sockets');


class Sockets {

    constructor( io ) {

        this.io = io;

        this.socketEvents();
    }

    socketEvents() {
        // On connection
        this.io.on('connection', async( socket ) => {
            
            // Validar el JWT 
           // Si el token no es válido, desconectar
            const [ valido, uid ] = comprobarJWT( socket.handshake.query['x-token']  );
            console.log(valido, uid)
            if ( !valido ) {
                console.log('socket no identificado');
                return socket.disconnect();
            }
            
            // Saber que usuario está activo mediante el UID
            await usuarioConectado( uid );
            console.log('cliente conectado')


            // Escuchar evento: mensaje-to-server
            socket.on('mensaje-to-server', ( data ) => {
                console.log( data );
                
                this.io.emit('mensaje-from-server', data );
            });

            // Socket join, uid
            // Unir al usuario a una sala de socket.io
              socket.join( uid );
            
            // Emitir todos los usuarios conectados
              this.io.emit( 'lista-usuarios', await getUsuarios() )

            // Escuchar cuando el cliente manda un mensaje
            // mensaje-personal
              socket.on( 'mensaje-personal', async( payload ) => {
                console.log({payload})
               
                const mensaje = await grabarMensaje( payload );
                this.io.to( payload.para ).emit( 'mensaje-personal', mensaje );
                this.io.to( payload.de ).emit( 'mensaje-personal', mensaje );
            });
            

            // Disconnect
            // Marcar en la BD que el usuario se desconecto
            socket.on('disconnect', async() => {
                console.log('disconect')
                await usuarioDesconectado( uid );
                // Emitir todos los usuarios conectados 
                this.io.emit( 'lista-usuarios', await getUsuarios() )
            })
            
        });
    }


}


module.exports = Sockets;