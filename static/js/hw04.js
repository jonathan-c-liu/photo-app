const story2Html = story => {
    return `
        <div>
            <img src="${ story.user.thumb_url }" class="pic" alt="profile pic for ${ story.user.username }" />
            <p>${ story.user.username }</p>
        </div>
    `;
};

const profile2Html = profile => {
    return `
        <img class="pic" src="${profile.image_url}" alt="User profile image">
        <h2>${profile.username}</h2>
    `
}

const suggestion2Html = suggestion => {
    return `
        <section>
            <img src="${suggestion.thumb_url}" class="pic" alt="profile pic for ${suggestion.username}"/>
            <div>
                <p>${suggestion.username}</p>
                <p>Suggested for you</p>
            </div>
            <button
                class="link following"
                data-user-id="${suggestion.id}"
                data-username="${suggestion.username}"
                aria-label="Follow ${suggestion.username}"
                aria-checked="false"
                onClick="toggleFollow(event)"
            >
                Follow
            </button>
        </section>
    `
}

const post2Html = post => {
    return `
        <section class="card" id="card-${post.id}">
            <div class="header">
                <h3>${ post.user.username }</h3>
                <i class="fa fa-ellipsis-h"></i>
            </div>
            <img src="${ post.image_url }" alt="Image posted by ${ post.user.username }" width="300" height="300">
            <div class="info">
                <div class="buttons">
                    <div>
                        <button
                            data-post-id="${post.id}"
                            data-like-id="${post.current_user_like_id}"
                            aria-label="${post.current_user_like_id ? 'Unlike' : 'Like'} post ${post.id}"
                            aria-checked=${post.current_user_like_id}
                            onclick="toggleLike(event)"
                        >
                            <i class="fa${ post.current_user_like_id ? 's' : 'r' } fa-heart"></i>
                        </button>
                        <button>
                            <i class="far fa-comment"></i>
                        </button>
                        <button>
                            <i class="far fa-paper-plane"></i>
                        </button>
                    </div>
                    <div>
                        <button
                            data-post-id="${post.id}"
                            data-bookmark-id="${post.current_user_bookmark_id}"
                            aria-label="${post.current_user_bookmark_id ? 'Unbookmark' : 'Bookmark'} post ${post.id}"
                            aria-checked=${post.current_user_bookmark_id}
                            onclick="toggleBookmark(event)"
                        >
                            <i class="fa${ post.current_user_bookmark_id ? 's' : 'r' } fa-bookmark"></i>
                        </button>    
                    </div>
                </div>
                <p class="likes"><strong>${ post.likes.length } like${post.likes.length != 1 ? 's' : ''}</strong></p>
                <div class="caption">
                    <p>
                        <strong>${ post.user.username }</strong> 
                        ${ post.caption }
                    </p>
                </div>
                <div class="comments">
                    ${ displayComments(post.comments, post.id) }
                </div>
                <p class="timestamp">${post.display_time}</p>
            </div>
            <div class='add-comment'>
                ${displayAddComments(post.id)}
            </div>
        </section>
    `;
};

const modal2Html = post => {
    return `
        <div class="modal-bg" data-post-id="${post.id}">
            <button
                id="close-modal-btn"
                aria-label="Close comments"
                onclick="closeModal(event)"
            >
                <i class="fas fa-times"></i>
            </button>
            <div class="modal">
                <img class="pic" src="${post.image_url}" alt="Image for ${post.user.username}'s post"/>
                <div class="content">
                    <header>
                        <img src="${post.user.image_url}" alt="Profile image for ${post.user.username}"/>
                        <h3>${post.user.username}</h3>
                    </header>
                    <div class="comments">
                        ${comment2Html({user: post.user, text: post.caption})}
                        ${post.comments.map(comment2Html).join('\n')}
                    </div>
                </div>
            </div>
        </div>
    `;
};

const comment2Html = comment => {
    return `
        <div class="comment-container">
            <img src="${comment.user.thumb_url}" alt="Profile image for ${comment.user.username}"/>
            <div>
                <p>
                    <strong>${comment.user.username}</strong> 
                    ${comment.text}
                </p>
            </div>
        </div>
    `
};

const reloadPost = (postId) => {
    fetch(`/api/posts/${postId}`)
        .then(response => response.json())
        .then(post => {
            const html = post2Html(post);
            document.querySelector(`#card-${post.id}`).outerHTML = html;
        })
}

const followUser = (username, elem) => {
    const userId = elem.dataset.userId;
    fetch('/api/following', {
        method: 'POST',
        headers: {
           'Content-Type': 'application/json' 
        },
        body: JSON.stringify({
            user_id: userId
        })
    })
    .then(response => response.json())
    .then(data => {
        console.log(data);
        elem.setAttribute("data-following-id", data.id);
        elem.setAttribute("aria-checked", "true");
        elem.setAttribute("aria-label", "Unfollow "+username);
        elem.innerHTML="Unfollow";
        elem.classList.add("active");
    })
}

const unfollowUser = (username, elem) => {
    const followingId = elem.dataset.followingId;
    fetch(`/api/following/${followingId}`, {
        method: 'DELETE'
    })
    .then(response => response.json())
    .then(data => {
        console.log(data);
        elem.removeAttribute("data-following-id");
        elem.setAttribute("aria-checked", "false");
        elem.setAttribute("aria-label", "Follow "+username);
        elem.innerHTML="Follow";
        elem.classList.remove("active");
    })
}

const toggleFollow = (event) => {
    const element = event.target;
    const username = element.dataset.username;
    if(element.getAttribute("aria-checked")=="false"){
        followUser(username, element);
    } else {
        unfollowUser(username, element);
    }
}

const likePost = (elem) => {
    fetch(`/api/posts/${elem.dataset.postId}/likes`, {
        method: 'POST',
        headers: {
           'Content-Type': 'application/json' 
        },
    })
    .then(response => response.json())
    .then(data => {
        console.log(data);
        reloadPost(elem.dataset.postId);
    })
}

const unlikePost = (elem) => {
    fetch(`/api/posts/${elem.dataset.postId}/likes/${elem.dataset.likeId}`, {
        method: 'DELETE'
    })
    .then(response => response.json())
    .then(data => {
        console.log(data);
        reloadPost(elem.dataset.postId);
    })
}

const toggleLike = (e) => {
    const elem = e.currentTarget;
    console.log(elem);
    if (elem.getAttribute("aria-checked") == "undefined") {
        likePost(elem);
    } else {
        unlikePost(elem);
    }
}

const bookmarkPost = (elem) => {
    fetch('/api/bookmarks', {
        method: 'POST',
        headers: {
           'Content-Type': 'application/json' 
        },
        body: JSON.stringify({
            post_id: elem.dataset.postId
        })
    })
    .then(response => response.json())
    .then(data => {
        console.log(data);
        reloadPost(elem.dataset.postId);
    })
}

const unbookmarkPost = (elem) => {
    const bookmarkId = elem.dataset.bookmarkId;
    fetch(`/api/bookmarks/${bookmarkId}`, {
        method: 'DELETE'
    })
    .then(response => response.json())
    .then(data => {
        console.log(data);
        reloadPost(elem.dataset.postId);
    })
}

const toggleBookmark = (e) => {
    const elem = e.currentTarget;
    if (elem.getAttribute("aria-checked") == "undefined") {
        bookmarkPost(elem);
    } else {
        unbookmarkPost(elem);
    }
}

const addComment = (e) => {
    const elem = e.target;
    const postId  = elem.dataset.postId;
    const text = document.getElementById(`input-${postId}`).value;
    fetch(`/api/comments`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json' 
        },
        body: JSON.stringify({
            post_id: postId,
            text: text,
        })
    }).then(response => response.json()
    ).then(data => {
        console.log(data);
        reloadPost(postId);
    })
}

const closeModal = e => {
    let postId = document.querySelector(".modal-bg").dataset.postId;
    document.getElementById(`view-comments-${postId}`).focus();
    document.querySelector('#modal-container').innerHTML = "";
    document.body.style.overflowY = 'auto';
};

const showModal = e => {
    const postId = e.currentTarget.dataset.postId;
    fetch(`/api/posts/${postId}`)
        .then(response => response.json())
        .then(post => {
            const html = modal2Html(post);
            let modalContainer = document.querySelector('#modal-container');
            modalContainer.innerHTML = html;
            document.getElementById("close-modal-btn").focus();
        })
    document.body.style.overflowY = 'hidden';
};

const displayComments = (comments, postID) => {
    let html = '';
    if (comments.length > 1) {
        html += `
            <button id="view-comments-${postID}" class="link" data-post-id="${postID}" onclick="showModal(event);">
                view all ${comments.length} comments
            </button>
        `;
    }
    if (comments && comments.length > 0) {
        const lastComment = comments[comments.length - 1];
        html += `
            <p>
                <strong>${lastComment.user.username}</strong> 
                ${lastComment.text}
            </p>
        `
    }
    return html;
};

const displayAddComments = (postId) => {
    const html = `
        <div class="input-holder">
            <input id="input-${postId}" type="text" aria-label="Add a comment" placeholder="Add a comment...">
        </div>
        <button
            class="link"
            data-post-id=${postId}
            aria-label="Post comment to post ${postId}"
            onClick="addComment(event)"
        >
            Post
        </button>
    `;
    return html;
};

const displayStories = () => {
    fetch('/api/stories')
        .then(response => response.json())
        .then(stories => {
            const html = stories.map(story2Html).join('\n');
            document.querySelector('.stories').innerHTML = html;
        })
};

const displayProfile = () => {
    fetch('/api/profile')
    .then(response => response.json())
    .then(profile => {
        const html = profile2Html(profile);
        document.querySelector('#profile').innerHTML = html;
    })
}

const displaySuggestions = () => {
    fetch('/api/suggestions')
    .then(response => response.json())
    .then(suggestions => {
        const html = suggestions.map(suggestion2Html).join('\n');
        document.querySelector('#suggestions-list').innerHTML = html;
    })
}

const displayPosts = () => {
    fetch('/api/posts')
        .then(response => response.json())
        .then(posts => {
            const html = posts.map(post2Html).join('\n');
            document.querySelector('#posts').innerHTML = html;
        })
};

const initPage = () => {
    displayStories();
    displayProfile();
    displaySuggestions();
    displayPosts();
};

// invoke init page to display stories:
initPage();