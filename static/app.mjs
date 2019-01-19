import * as model from './db.mjs';

if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/static/sw.js');
}
// Requesting permission for Notifications after clicking on the button
const button = document.getElementById("notifications");
if (button) {
    button.addEventListener('click', function (e) {
        Notification.requestPermission().then(function (result) {
            if (result === 'granted') {
                randomNotification();
            }
        });
    });
}

// Setting up random Notification
function randomNotification() {
    const notifTitle = '空提示标题';
    const options = {
        body: '空提示主体',
    };
    const notif = new Notification(notifTitle, options);
    setTimeout(randomNotification, 2 * 60 * 1000);
}

// Progressive loading images
const imagesToLoad = document.querySelectorAll('img[data-src]');
const loadImages = function (image) {
    image.setAttribute('src', image.getAttribute('data-src'));
    image.onload = function () {
        image.removeAttribute('data-src');
    };
};
if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(function (items, observer) {
        items.forEach(function (item) {
            if (item.isIntersecting) {
                loadImages(item.target);
                observer.unobserve(item.target);
            }
        });
    });
    imagesToLoad.forEach(function (img) {
        observer.observe(img);
    });
} else {
    imagesToLoad.forEach(function (img) {
        loadImages(img);
    });
}

function createElement({tagName, children = []}) {
    const elem = document.createElement(tagName);
    children.forEach(child => {
        if (typeof child === "object") {
            elem.appendChild(createElement(child));
        } else {
            elem.textContent = child;
        }
    });
    return elem;
}

function tagFactory(tagName) {
    return function (children) {
        return {
            tagName,
            children
        };
    };
}

const ul = tagFactory('ul');
const li = tagFactory('li');
const p = tagFactory('p');
const app = document.getElementById('app');

function invertIndex(array) {
    return array.reduce((ret, cur) => {
        ret[cur.id] = cur;
        return ret;
    }, {});
}

const pTags = model.allTags();
const pRecipes = model.allRecipes();
const pRelations = model.allRelations();

Promise.all([pTags, pRecipes, pRelations])
    .then(([tags, recipes, relations]) => {
        const relation = relations.reduce((ret, cur) => {
            const {tagId, recipeId} = cur;
            if (ret[tagId]) {
                ret[tagId].push(recipeId);
            } else {
                ret[tagId] = [recipeId];
            }
            return ret;
        }, {});
        const invertedRecipes = invertIndex(recipes);
        const invertedTags = invertIndex(tags);
        const randomBtn = document.getElementById('random');
        const randomText = document.getElementById('recipe');
        randomBtn.addEventListener('click', function () {
            const pick = _.head(_.shuffle(relations));
            const tag = invertedTags[pick.tagId].tag;
            const recipe = invertedRecipes[pick.recipeId].name;
            randomText.innerText = `今晚吃：${tag} - ${recipe}`;
        });
        return Object.keys(relation).reduce((ret, cur) => {
            const tag = invertedTags[cur].tag;
            const names = relation[cur].map(recipeId => invertedRecipes[recipeId].name);
            ret.push(
                li([
                    tag,
                    p([names.join(', ')])
                ])
            );
            return ret;
        }, [])
    })
    .then(list => {
        const el = createElement(ul(list));
        app.appendChild(el);
    });
