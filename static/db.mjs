const db = new Dexie("cuisines");
db.version(1).stores({
    recipes: '++id,name',
    tags: '++id,tag',
    x: '++id,rt,recipeId,tagId',
});
db.on("ready", populate);
db.open();

function createRecipe(name) {
    return db.recipes.add({name});
}

function createTag(tag) {
    return db.tags.add({tag});
}

function readRecipe(recipeId) {
    return db.recipes.get(recipeId);
}

function readTag(tagId) {
    return db.tags.get(tagId);
}

function updateRecipe(recipeId, recipe) {
    return db.recipes.update(recipeId, recipe)
}

function updateTag(tagId, tag) {
    return db.tags.update(tagId, tag)
}

function deleteRecipe(recipeId) {
    return db.transaction('rw', db.recipes, db.x, function () {
        const pR = db.recipes.delete(recipeId);
        const pX = db.x.where({recipeId}).delete();
        return Promise.all([pR, pX]);
    });
}

function deleteTag(tagId) {
    return db.transaction('rw', db.tags, db.x, function () {
        const pR = db.tags.delete(tagId);
        const pX = db.x.where({tagId}).delete();
        return Promise.all([pR, pX]);
    });
}

function createRelation(tagId, recipeId) {
    return db.x.add({tagId, recipeId});
}

function readRelation({tagId, recipeId}) {
    return db.x.where({tagId, recipeId}).toArray();
}

function deleteRelation({tagId, recipeId}) {
    return db.x.where({tagId, recipeId}).delete();
}

function allRecipes() {
    return db.recipes.toArray();
}

function allRelations() {
    return db.x.toArray();
}

function allTags() {
    return db.tags.toArray();
}

function populate() {
    const array = ['recipes', 'tags'].map(table => db[table].count());
    return Promise.all(array).then(([recipes, tags]) => {
        if (recipes <= 0 && tags <= 0) {
            console.log("Database is empty. Populating from ajax call...");
            return fetch('/static/recipe.json')
                .then(res => res.json())
                .then(data =>
                    db.transaction('rw', db.recipes, db.tags, db.x, function () {
                        console.log("Got ajax response. We'll now add the objects.");
                        Object.keys(data).forEach(tag => {
                            const pTag = db.tags.add({tag});
                            const pRecipes = data[tag].map(name => db.recipes.add({name}));
                            return Promise.all([pTag, ...pRecipes])
                                .then(([tagId, ...recipes]) =>
                                    recipes.forEach(recipeId =>
                                        db.x.add({
                                            rt: `${recipeId}+${tagId}`,
                                            recipeId,
                                            tagId,
                                        })
                                    )
                                );
                        })

                    })
                );
        } else {
            console.log("Already populated");
        }
    })
}

export {
    allRecipes,
    allRelations,
    allTags,
    createRecipe,
    createTag,
    createRelation,
    readRecipe,
    readTag,
    readRelation,
    updateRecipe,
    updateTag,
    deleteRecipe,
    deleteTag,
    deleteRelation,
}
