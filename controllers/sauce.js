const Sauce = require('../models/Sauce');
const fs = require('fs');

exports.createSauce = (req, res, next) => {
    const sauceObject = JSON.parse(req.body.sauce);
    delete sauceObject._id;
    const sauce = new Sauce({
        ...sauceObject,
        imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}`,
        likes: 0,
        dislikes: 0,
        usersLiked: [],
        usersDisliked: []
    });
    sauce.save()
    .then(() => res.status(201).json({message: 'Object saved'}))
    .catch(error => res.status(400).json({error}));
};

exports.modifySauce = (req, res, next) => {
    let sauceObject;
    if(req.file) {
        console.log('req file existant');
        Sauce.findOne({_id: req.params.id})
        .then(sauce => {
            console.log('sauce trouvée');
            const filename = sauce.imageUrl.split('/images/')[1];
            fs.unlink(`images/${filename}`, () => {
                console.log('image unlink');
                sauceObject = {
                    ...JSON.parse(req.body.sauce),
                    imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}`
                };
                console.log(typeof sauceObject)
                console.log(sauceObject);
            })
        })
        .catch(error => res.status(500).json({error}));
    } else {
        sauceObject = {...req.body};
        console.log(sauceObject);
    };
    Sauce.updateOne({_id: req.params.id}, {...sauceObject, _id: req.params.id})
    .then(() => res.status(200).json({message: 'Sauce successfully modified'}))
    .catch(error => res.status(400).json({error}));
};

exports.deleteSauce = (req, res, next) => {
    Sauce.findOne({_id: req.params.id})
    .then(sauce => {
        const filename = sauce.imageUrl.split('/images/')[1];
        fs.unlink(`images/${filename}`, () => {
            Sauce.deleteOne({_id: req.params.id})
            .then(() => res.status(200).json({message: 'Object successfully deleted'}))
            .catch(error => res.status(400).json({error}));
        })
    })
    .catch(error => res.status(500).json({error}));
};

exports.likeSauce = (req, res, next) => {
    Sauce.findOne({_id: req.params.id})
    .then(sauce => {

        console.log('sauce found');
        let sauceObject;

        const hasTheUserAlreadyLikedOrDisliked = () => {

            const likesList = sauce.usersLiked;
            const dislikesList = sauce.usersDisliked;

            for(let userId of likesList) {
                if(userId === req.body.userId) {
                    return 'likes';
                };
            };

            for(let userId of dislikesList) {
                if(userId === req.body.userId) {
                    return 'dislikes';
                };
            };

            return false;
        };

        console.log('function hasUser: ' + hasTheUserAlreadyLikedOrDisliked());
        console.log('reqbodylike: ' + req.body.like);


        if(req.body.like === 1 && !hasTheUserAlreadyLikedOrDisliked()) {
            console.log('if condition 1');
            sauceObject = {
                ...sauce,
                likes: sauce.likes++,
                usersLiked: sauce.usersLiked.push(req.body.userId)
            };
            console.log('sauceObject created');
            console.log(sauceObject);

        } else if(req.body.like === -1 && !hasTheUserAlreadyLikedOrDisliked()) {
            console.log('if condition 2');
            sauceObject = {
                ...sauce,
                dislikes: sauce.dislikes++,
                usersDisliked : sauce.usersDisliked.push(req.body.userId)
            };

        } else if(req.body.like === 0 & hasTheUserAlreadyLikedOrDisliked() === 'likes') {
            console.log('if condition 3');
            const newUsersLiked = sauce.usersLiked;
            const index = newUsersLiked.indexOf(req.body.userId);
            newUsersLiked.splice(index, 1);
            sauceObject = {
                ...sauce,
                likes: sauce.likes--,
                usersLiked: newUsersLiked
            };

        } else if(req.body.like === 0 && hasTheUserAlreadyLikedOrDisliked() === 'dislikes') {
            console.log('if condition 4');
            const newUsersDisliked = sauce.usersDisliked;
            const index = newUsersDisliked.indexOf(req.body.userId);
            newUsersDisliked.splice(index, 1);
            sauceObject = {
                ...sauce,
                dislikes: sauce.dislikes--,
                usersDisliked: newUsersDisliked
            };

        } else {
            console.log('no if condition matched');
            return res.status(400).json({message: 'The user cannot like/dislike the sauce'});
        }
        console.log('updateOne object: ' + sauceObject);
        console.log(typeof sauceObject);
        Sauce.updateOne({_id: req.params.id}, {...sauceObject, _id: req.params.id})
        .then(() => res.status(200).json({message: 'Sauce successfully liked/disliked'}))
        .catch(error => res.status(400).json({error}));
    })
    .catch(error => res.status(400).json({error}));
};
 
exports.getOneSauce = (req, res, next) => {
    Sauce.findOne({_id: req.params.id})
    .then(sauce => res.status(200).json(sauce))
    .catch(error => res.status(404).json({error}));
};

exports.getAllSauces = (req, res, next) => {
    Sauce.find()
    .then(sauces => res.status(200).json(sauces))
    .catch(error => res.status(400).json({error}));
};