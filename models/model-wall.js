// modelo-wall.js
const mongoose = require('mongoose');

const wallSchema = new mongoose.Schema({
	// ? Creamos el nuevo Schema
	// ?Añadimos los diferentes tipos de contenido (campos) e indicamos su tipo.
	message: {
		type: String,
		required: true,
		trim: true,
	},
	pilot: {
		type: mongoose.Types.ObjectId,
		trim: true,
		ref: 'Pilot',
	},
	
});

// ? Creamos el Modelo
module.exports = mongoose.model('Wall', wallSchema);
