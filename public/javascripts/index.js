/* eslint-disable no-console */
// FAQ QUESTIONS ON THE MAIN PAGE
//
//
document.querySelectorAll('.faq-question').forEach(button => {
    button.addEventListener('click', () => {
        const faqAnswer = button.nextElementSibling;
        const arrow = button.querySelector('.arrow');

        if (faqAnswer.style.display === 'block') {
            faqAnswer.style.display = 'none';
            arrow.innerHTML = '&#9654;';
        } else {
            document.querySelectorAll('.faq-answer').forEach(answer => {
                answer.style.display = 'none';
            });
            document.querySelectorAll('.faq-question .arrow').forEach(arrow => {
                arrow.innerHTML = '&#9654;';
            });
            faqAnswer.style.display = 'block';
            arrow.innerHTML = '&#9660;';
        }
    });
});

// for navbar
//
//
// Load navbar and footer once the DOM is fully loaded
$(function () {
    $("#navbar-placeholder").load("navbar.html", function () {
        var current = location.pathname.split("/").slice(-1)[0];
        $('nav ul li a').each(function () {
            if ($(this).attr('href') === current) {
                $(this).addClass('active');
            }
        });
    });

    $("#footer-placeholder").load("footer.html");
});


// object which stores the location of each image correlating with the title of the event
const eventImages = {
    "Cleanup": "images/event1.jpg",
    "Food Drive": "images/event2.jpg",
    "Tree Planting": "images/event3.jpg",
    "Charity Run": "images/event4.jpg",
    "Planting Trees in the Adelaide Hills": "images/va_1.avif",
    "Constructing Community Housing": "images/va_2.jpg",
    "Help feed the Kangaroos": "images/va_3.jpg",
    "Volunteer at our next charity marathon": "images/vasnt_1.webp",
    "Beach Cleanup": "images/vasnt_2.jpg",
    "Disaster Relief 101": "images/vasnt_3.webp"
  };

  // script to load all events
  document.addEventListener("DOMContentLoaded", function() {
    fetch('/api/events')
        .then(response => response.json())
        .then(data => {
            const container = document.getElementById('events-page-container');
            data.forEach(event => {
                const imageSrc = eventImages[event.title] || 'images/default.jpg';
                const eventCard = document.createElement('div');
                eventCard.classList.add('event-card');
                eventCard.innerHTML = `
                    <img src="${imageSrc}" alt="${event.title} Image" class="event-card-image">
                    <div class="event-card-details">
                        <h3 class="event-card-title">${event.title}</h3>
                        <p class="event-card-date">Date: ${new Date(event.date).toLocaleDateString()}</p>
                        <p class="event-card-location">Location: ${event.street_num} ${event.street_name}, ${event.city}, ${event.state_region}, ${event.postcode}, ${event.country}</p>
                        <p>${event.description}</p>
                        <button class="button rsvp-button" data-event-id="${event.event_id}">RSVP</button>
                    </div>
                `;
                container.appendChild(eventCard);
            });

            // Add event listeners to RSVP buttons
            document.querySelectorAll('.rsvp-button').forEach(button => {
                button.addEventListener('click', function() {
                    const eventId = this.getAttribute('data-event-id');
                    const userId = 1; // Replace this with the actual user ID

                    fetch(`/api/events/${eventId}/rsvp`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ user_id: userId })
                    })
                    .then(response => {
                        if (!response.ok) {
                            throw new Error('Network response was not ok');
                        }
                        return response.json();
                    })
                    .then(data => {
                        if (data.success) {
                            alert('RSVP successful!');
                        } else {
                            alert('RSVP failed. Please try again.');
                        }
                    })
                    .catch(error => {
                        console.error('Error RSVPing to event:', error);
                        alert('RSVP failed. Please try again.');
                    });
                });
            });
        })
        .catch(error => {
            console.error('Error fetching events:', error);
        });
});

// individual organisation pages

document.addEventListener("DOMContentLoaded", function() {
    function loadEvents(containerId, startIndex, endIndex) {
        fetch('/api/events')
            .then(response => response.json())
            .then(data => {
                const container = document.getElementById(containerId);
                const filteredData = data.slice(startIndex, endIndex + 1);
                filteredData.forEach(event => {
                    const imageSrc = eventImages[event.title] || 'images/default.jpg';
                    const eventCard = document.createElement('div');
                    eventCard.classList.add('event-card');
                    eventCard.innerHTML = `
                        <img src="${imageSrc}" alt="${event.title} Image" class="event-card-image">
                        <div class="event-card-details">
                            <h3 class="event-card-title">${event.title}</h3>
                            <p class="event-card-date">Date: ${new Date(event.date).toLocaleDateString()}</p>
                            <p class="event-card-location">Location: ${event.street_num} ${event.street_name}, ${event.city}, ${event.state_region}, ${event.postcode}, ${event.country}</p>
                            <p>${event.description}</p>
                            <a href="event_detail.html?event_id=${event.event_id}" class="button">RSVP</a>
                        </div>
                    `;
                    container.appendChild(eventCard);
                });
            })
            .catch(error => {
                console.error('Error fetching events:', error);
            });
    }

    // Load events for different sections
    loadEvents('events-page-container1', 0, 3);  // Southern Cross Care
    loadEvents('events-page-container2', 4, 6);  // Volunteering Australia
    loadEvents('events-page-container3', 7, 9);  // VA SA&NT
});

//
// posts.html
//

// Function to format the date
function formatDate(dateString) {
    const options = { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleDateString(undefined, options);
}

// Function to fetch posts from the server
function fetchPosts() {
    fetch('/api/posts')
        .then(response => response.json())
        .then(posts => {
            const postsContainer = document.getElementById('posts-container');
            postsContainer.innerHTML = ''; // Clear existing posts

            // Filter posts to only include those with visibility = 1
            const visiblePosts = posts.filter(post => post.visibility === 1);

            visiblePosts.forEach(post => {
                const postCard = document.createElement('div');
                postCard.classList.add('post-card');
                postCard.innerHTML = `
                    <p class="post-title">${post.post_title}</p>
                    <p class="post-content">${post.post_content}</p>
                    <p class="post-time">${formatDate(post.post_time)}</p>
                    <p class="post-user">Posted by: ${post.username}</p>
                    <p class="post-branch">Branch: ${post.branch_name}</p>
                `;
                postsContainer.appendChild(postCard);
            });
        })
        .catch(error => {
            console.error('Error fetching posts:', error);
        });
}

// Load posts when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', function () {
    fetchPosts();
});

//
// organisations pages
//