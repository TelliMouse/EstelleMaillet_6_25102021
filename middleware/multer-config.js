const multer = require('multer');

const MIME_TYPES = {
    'image/jpg': 'jpg',
    'image/jpeg': 'jpg',
    'image/png': 'png'
};

const storage = multer.diskStorage({
    destination: (req, file, callback) => {
        callback(null, 'images')
    },
    filename: (req, file, callback) => {
        const startingName = file.originalname.split(' ').join('_');
        //Delete the extension at the end of the filename, to then add the date, and the new extension
        let name;
        if(/.jpg$/.test(startingName)) {
            name = startingName.split('.jpg')[0];
        } else if (/.jpeg$/.test(startingName)) {
            name = startingName.split('.jpeg')[0];
        } else if (/.png$/.test(startingName)) {
            name = startingName.split('.png')[0];
        }
        const extension = MIME_TYPES[file.mimetype];
        callback(null, name + Date.now() + '.' + extension);
    }
});

module.exports = multer({storage}).single('image');