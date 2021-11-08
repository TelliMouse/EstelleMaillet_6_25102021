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

exports.modifySauce = async (req, res, next) => {
    if(req.file) {
        Sauce.findOne({_id: req.params.id})
        .then(sauce => {
            const filename = sauce.imageUrl.split('/images/')[1];
            fs.unlink(`images/${filename}`, () => {
                const sauceObject = {
                    ...JSON.parse(req.body.sauce),
                    imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}`
                };
                Sauce.updateOne({_id: req.params.id}, {...sauceObject, _id: req.params.id})
                .then(() => res.status(200).json({message: 'Sauce successfully modified'}))
                .catch(error => res.status(400).json({error}));
            })
        })
        .catch(error => res.status(500).json({error}));
    } else {
        const sauceObject = {...req.body};
        Sauce.updateOne({_id: req.params.id}, {...sauceObject, _id: req.params.id})
        .then(() => res.status(200).json({message: 'Sauce successfully modified'}))
        .catch(error => res.status(400).json({error}));
    }
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

        if(req.body.like === 1 && !hasTheUserAlreadyLikedOrDisliked()) {
            sauce.usersLiked.push(req.body.userId);
            const sauceObject = {
                ...sauce._doc,
                likes: sauce.likes + 1,
                usersLiked: sauce.usersLiked
            };
            Sauce.updateOne({_id: req.params.id}, {...sauceObject, _id: req.params.id})
            .then(() => res.status(200).json({message: 'Sauce successfully liked/disliked'}))
            .catch(error => res.status(400).json({error}));

        } else if(req.body.like === -1 && !hasTheUserAlreadyLikedOrDisliked()) {
            sauce.usersDisliked.push(req.body.userId);
            const sauceObject = {
                ...sauce._doc,
                dislikes: sauce.dislikes + 1,
                usersDisliked : sauce.usersDisliked
            };
            Sauce.updateOne({_id: req.params.id}, {...sauceObject, _id: req.params.id})
            .then(() => res.status(200).json({message: 'Sauce successfully liked/disliked'}))
            .catch(error => res.status(400).json({error}));

        } else if(req.body.like === 0 & hasTheUserAlreadyLikedOrDisliked() === 'likes') {
            const index = sauce.usersLiked.indexOf(req.body.userId);
            sauce.usersLiked.splice(index, 1);
            const sauceObject = {
                ...sauce._doc,
                likes: sauce.likes - 1,
                usersLiked: sauce.usersLiked
            };
            Sauce.updateOne({_id: req.params.id}, {...sauceObject, _id: req.params.id})
            .then(() => res.status(200).json({message: 'Sauce successfully liked/disliked'}))
            .catch(error => res.status(400).json({error}));

        } else if(req.body.like === 0 && hasTheUserAlreadyLikedOrDisliked() === 'dislikes') {
            const index = sauce.usersDisliked.indexOf(req.body.userId);
            sauce.usersDisliked.splice(index, 1);
            const sauceObject = {
                ...sauce._doc,
                dislikes: sauce.dislikes - 1,
                usersDisliked: sauce.usersDisliked
            };
            Sauce.updateOne({_id: req.params.id}, {...sauceObject, _id: req.params.id})
            .then(() => res.status(200).json({message: 'Sauce successfully liked/disliked'}))
            .catch(error => res.status(400).json({error}));

        } else {
            return res.status(400).json({message: 'The user cannot like/dislike the sauce'});
        }
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