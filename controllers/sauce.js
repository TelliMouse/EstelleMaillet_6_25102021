const Sauce = require('../models/Sauce');
const fs = require('fs');

exports.createSauce = (req, res, next) => {
    const sauceObject = JSON.parse(req.body.sauce);
    //Delete automatically given id to be able to recieve an ID through MongoDB
    delete sauceObject._id;
    const sauce = new Sauce({
        //Retrieve sauce data from request and add to the object, likes, dislikes and ID of users that liked or disliked
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
    //We treat a request differently when there is a file than when there isn't
    if(req.file) {
        Sauce.findOne({_id: req.params.id})
        .then(sauce => {
            const filename = sauce.imageUrl.split('/images/')[1];
            //Delete the old image for the sauce from the images directory before adding the new one
            fs.unlink(`images/${filename}`, () => {
                //Update the sauce with new data and a new URL for the new image
                const sauceObject = {
                    ...JSON.parse(req.body.sauce),
                    imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}`
                };
                //First parameter: which sauce to update, i.e. the sauce with the id that is the same than the one in the request; second parameter: the object containing what we will update in the sauce
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

//Find the sauce we want to delete, delete its image from the images directory and then delete the rest of the sauce
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
    //First we find the sauce we want to like/dislike
    Sauce.findOne({_id: req.params.id})
    .then(sauce => {

        //We find if the user has already liked or disliked the sauce 
        const hasTheUserAlreadyLikedOrDisliked = () => {

            //We retrieve the arrays containing the ID of users who have respectively liked or disliked the sauce
            const likesList = sauce.usersLiked;
            const dislikesList = sauce.usersDisliked;

            //Return 'likes' if the user has liked
            for(let userId of likesList) {
                if(userId === req.body.userId) {
                    return 'likes';
                };
            };

            //Return 'dislikes' if the user has disliked
            for(let userId of dislikesList) {
                if(userId === req.body.userId) {
                    return 'dislikes';
                };
            };

            return false;
        };

        //When the user likes ('req.body.like === 1') and hasn't already liked/disliked
        if(req.body.like === 1 && !hasTheUserAlreadyLikedOrDisliked()) {
            //We add the userID in the right array, add 1 to the number of likes, then update the sauce with this new data
            sauce.usersLiked.push(req.body.userId);
            const sauceObject = {
                ...sauce._doc,
                likes: sauce.likes + 1,
                usersLiked: sauce.usersLiked
            };
            Sauce.updateOne({_id: req.params.id}, {...sauceObject, _id: req.params.id})
            .then(() => res.status(200).json({message: 'Sauce successfully liked/disliked'}))
            .catch(error => res.status(400).json({error}));

            //When the user dislikes ('req.body.like === 1') and hasn't already liked/disliked
        } else if(req.body.like === -1 && !hasTheUserAlreadyLikedOrDisliked()) {
            //Works the same as above
            sauce.usersDisliked.push(req.body.userId);
            const sauceObject = {
                ...sauce._doc,
                dislikes: sauce.dislikes + 1,
                usersDisliked : sauce.usersDisliked
            };
            Sauce.updateOne({_id: req.params.id}, {...sauceObject, _id: req.params.id})
            .then(() => res.status(200).json({message: 'Sauce successfully liked/disliked'}))
            .catch(error => res.status(400).json({error}));

            //When req.body.like === 0, the user delete their like or dislike
            //When the user delete their like
        } else if(req.body.like === 0 & hasTheUserAlreadyLikedOrDisliked() === 'likes') {
            //Find the user ID in the array and splice it, update the number of likes, and then update the whole sauce
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

            //When the user delete their dislike
        } else if(req.body.like === 0 && hasTheUserAlreadyLikedOrDisliked() === 'dislikes') {
            //Works the same as above
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

            //Catch a potential error, when none of the condition are fulfilled
        } else {
            return res.status(400).json({message: 'The user cannot like/dislike the sauce'});
        }
    })
    .catch(error => res.status(400).json({error}));
};
 
//Retrieve a sauce from its ID
exports.getOneSauce = (req, res, next) => {
    Sauce.findOne({_id: req.params.id})
    .then(sauce => res.status(200).json(sauce))
    .catch(error => res.status(404).json({error}));
};

//Retrieve all sauces
exports.getAllSauces = (req, res, next) => {
    Sauce.find()
    .then(sauces => res.status(200).json(sauces))
    .catch(error => res.status(400).json({error}));
};