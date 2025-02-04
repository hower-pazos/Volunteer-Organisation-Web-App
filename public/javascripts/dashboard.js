/* eslint-disable no-console */

document.addEventListener('DOMContentLoaded', function () {
    // Fetch user data from the API
    fetch('/api/user-profile')
        .then(response => response.json())
        .then(user => {
            document.getElementById('display-username').textContent = user.username;
            document.getElementById('display-phone').textContent = user.phone_number;
            document.getElementById('display-email').textContent = user.email_address;
            document.getElementById('display-role').textContent = user.role_permission;
            document.getElementById('display-email-notification').textContent = user.email_notifications ? 'On' : 'Off';
            document.getElementById('display-address').textContent = `${user.street_num} ${user.street_name}, ${user.city}, ${user.state_region}, ${user.postcode}, ${user.country}`;
            document.getElementById('display-organization').textContent = user.branch_name || 'N/A';

            // Set the form fields with the current values
            document.getElementById('username').value = user.username;
            document.getElementById('phone').value = user.phone_number;
            document.getElementById('address').value = `${user.street_num} ${user.street_name}, ${user.city}, ${user.state_region}, ${user.postcode}, ${user.country}`;
            document.getElementById('email-notification').checked = user.email_notifications;

            // Replace "Branch Name" placeholders
            const branchNameElements = document.querySelectorAll('.info-row.branch-name');
            branchNameElements.forEach(element => {
                element.textContent = user.branch_name || 'N/A';
            });
        })
        .catch(error => {
            console.error('Error fetching user data:', error);
        });

    // Select all sidebar links and main content sections
    const links = document.querySelectorAll('aside ul li a');
    const sections = document.querySelectorAll('main section');

    // Select elements for profile editing functionality
    const editButton = document.getElementById('edit-button');
    const editButton2 = document.getElementById('edit-button2');
    const saveButton = document.getElementById('save-changes');
    const profileInfo = document.querySelector('.profile-info');
    const profileForm = document.getElementById('profile-form');
    const addEventForm = document.getElementById('add-event-form');
    const saveEventButton = document.getElementById('save-event');
    const eventInfo = document.querySelector('.profile-info');



    const profileName = document.getElementById('profile-name');
    const displayUsername = document.getElementById('display-username');
    const usernameInput = document.getElementById('username');
    const displayPhone = document.getElementById('display-phone');
    const phoneInput = document.getElementById('phone');
    const displayAddress = document.getElementById('display-address');
    const addressInput = document.getElementById('address');
    const displayEmailNotification = document.getElementById('display-email-notification');
    const emailNotificationInput = document.getElementById('email-notification');

    // Function to hide all sections
    function hideAllSections() {
        sections.forEach(section => {
            section.classList.add('hidden');
        });
    }

    // Function to show a specific section
    function showSection(sectionId) {
        const section = document.getElementById(sectionId);
        if (section) {
            section.classList.remove('hidden');
        } else {
            console.error(`Section with ID '${sectionId}' not found.`);
        }
    }

    // Add click event listeners to sidebar links
    links.forEach(link => {
        link.addEventListener('click', function (event) {
            event.preventDefault(); // Prevent default link behavior
            hideAllSections(); // Hide all sections
            const sectionId = this.getAttribute('data-section'); // Get target section ID
            showSection(sectionId); // Show the target section
        });
    });

    // Initially show the profile section
    showSection('profile');

    saveEventButton.addEventListener('click', function (event) {
        event.preventDefault();

        const eventName = document.getElementById('event-name').value;
        const eventDesc = document.getElementById('event-desc').value;
        const eventDate = new Date(document.getElementById('event-date').value).toISOString(); // Convert to ISO string
        const eventStreetNum = document.getElementById('event-street-num').value;
        const eventStreetName = document.getElementById('event-street-name').value;
        const eventCity = document.getElementById('event-city').value;
        const eventStateRegion = document.getElementById('event-state-region').value;
        const eventPostcode = document.getElementById('event-postcode').value;
        const eventCountry = document.getElementById('event-country').value;

        fetch('/api/addEvent', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                event_name: eventName,
                event_desc: eventDesc,
                event_date: eventDate,
                street_num: eventStreetNum,
                street_name: eventStreetName,
                city: eventCity,
                state_region: eventStateRegion,
                postcode: eventPostcode,
                country: eventCountry,
            })
        })
            .then(response => response.json())
            .then(data => {
                console.log('Event added successfully:', data);
            })
            .catch(error => {
                console.error('Error adding event:', error);
            });
    });
});

//
// editing self-info
//
document.addEventListener('DOMContentLoaded', function () {
    const editButton = document.getElementById('edit-button');
    const saveButton = document.getElementById('save-changes');
    const profileInfo = document.querySelector('.profile-info');
    const profileForm = document.getElementById('profile-form');
    const displayUsername = document.getElementById('display-username');
    const displayPhone = document.getElementById('display-phone');
    const displayAddress = document.getElementById('display-address');
    const displayEmailNotification = document.getElementById('display-email-notification');
    const usernameInput = document.getElementById('username');
    const phoneInput = document.getElementById('phone');
    const streetNumInput = document.getElementById('street_num');
    const streetNameInput = document.getElementById('street_name');
    const cityInput = document.getElementById('city');
    const stateRegionInput = document.getElementById('state_region');
    const postcodeInput = document.getElementById('postcode');
    const countryInput = document.getElementById('country');
    const emailNotificationInput = document.getElementById('email-notification');

    // Show edit form
    editButton.addEventListener('click', function () {
        profileInfo.classList.add('hidden');
        profileForm.classList.remove('hidden');
    });

    // Handle form submission
    profileForm.addEventListener('submit', function (event) {
        event.preventDefault();

        const updatedUsername = usernameInput.value;
        const updatedPhone = phoneInput.value;
        const updatedStreetNum = streetNumInput.value;
        const updatedStreetName = streetNameInput.value;
        const updatedCity = cityInput.value;
        const updatedStateRegion = stateRegionInput.value;
        const updatedPostcode = postcodeInput.value;
        const updatedCountry = countryInput.value;
        const updatedEmailNotification = emailNotificationInput.checked ? 'On' : 'Off';

        fetch('/api/update_user', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                username: updatedUsername,
                phone: updatedPhone,
                street_num: updatedStreetNum,
                street_name: updatedStreetName,
                city: updatedCity,
                state_region: updatedStateRegion,
                postcode: updatedPostcode,
                country: updatedCountry,
                email_notifications: updatedEmailNotification === 'On'
            })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                displayUsername.textContent = updatedUsername;
                displayPhone.textContent = updatedPhone;
                displayAddress.textContent = `${updatedStreetNum} ${updatedStreetName}, ${updatedCity}, ${updatedStateRegion}, ${updatedPostcode}, ${updatedCountry}`;
                displayEmailNotification.textContent = updatedEmailNotification;

                profileInfo.classList.remove('hidden');
                profileForm.classList.add('hidden');
            } else {
                alert('Failed to update profile');
            }
        })
        .catch(error => {
            console.error('Error updating profile:', error);
        });
    });
});



// posts
document.addEventListener('DOMContentLoaded', function () {
    const addPostButton = document.getElementById('add-post-button');
    const addPostModal = document.getElementById('add-post-modal');
    const closeAddPostModal = document.getElementById('close-add-post-modal');
    const addPostForm = document.getElementById('add-post-form');

    const editPostModal = document.getElementById('edit-post-modal');
    const closeEditPostModal = document.getElementById('close-edit-post-modal');
    const editPostForm = document.getElementById('edit-post-form');

    addPostButton.addEventListener('click', function () {
        addPostModal.classList.remove('hidden');
    });

    closeAddPostModal.addEventListener('click', function () {
        addPostModal.classList.add('hidden');
    });

    closeEditPostModal.addEventListener('click', function () {
        editPostModal.classList.add('hidden');
    });

    addPostForm.addEventListener('submit', function (event) {
        event.preventDefault();

        const postTitle = document.getElementById('new-post-title').value;
        const postContent = document.getElementById('new-post-content').value;
        const postVisibility = document.getElementById('post-visibility').checked;

        fetch('/api/posts', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                post_title: postTitle,
                post_content: postContent,
                post_visibility: postVisibility
            })
        })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    fetchPostsDashboard();
                    addPostModal.classList.add('hidden');
                } else {
                    alert('Failed to add post');
                }
            })
            .catch(error => {
                console.error('Error adding post:', error);
            });
    });

    editPostForm.addEventListener('submit', function (event) {
        event.preventDefault();

        const postId = document.getElementById('edit-post-id').value;
        const postTitle = document.getElementById('edit-post-title').value;
        const postContent = document.getElementById('edit-post-content').value;
        const postVisibility = document.getElementById('edit-post-visibility').checked;

        fetch(`/api/posts/${postId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                post_title: postTitle,
                post_content: postContent,
                post_visibility: postVisibility
            })
        })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    fetchPostsDashboard();
                    editPostModal.classList.add('hidden');
                } else {
                    alert('Failed to edit post');
                }
            })
            .catch(error => {
                console.error('Error editing post:', error);
            });
    });

    function fetchPostsDashboard() {
        fetch('/api/posts-dashboard')
            .then(response => response.json())
            .then(posts => {
                const postsTableBody = document.getElementById('posts');
                postsTableBody.innerHTML = ''; // Clear existing table content

                posts.forEach(post => {
                    const row = document.createElement('tr');
                    row.innerHTML = `
                        <td>${post.post_title}</td>
                        <td>${post.post_content}</td>
                        <td>${new Date(post.post_time).toLocaleString()}</td>
                        <td>${post.username}</td>
                        <td>${post.branch_name}</td>
                        <td><button class="edit-button" data-id="${post.post_id}">Edit</button></td>
                        <td><button class="delete-button" data-id="${post.post_id}">Delete</button></td>
                    `;
                    postsTableBody.appendChild(row);

                    row.querySelector('.edit-button').addEventListener('click', function () {
                        document.getElementById('edit-post-id').value = post.post_id;
                        document.getElementById('edit-post-title').value = post.post_title;
                        document.getElementById('edit-post-content').value = post.post_content;
                        document.getElementById('edit-post-visibility').checked = post.visibility === 1;
                        editPostModal.classList.remove('hidden');
                    });

                    row.querySelector('.delete-button').addEventListener('click', function () {
                        if (confirm('Are you sure you want to delete this post?')) {
                            fetch(`/api/posts/${post.post_id}`, {
                                method: 'DELETE',
                                headers: {
                                    'Content-Type': 'application/json'
                                }
                            })
                                .then(response => response.json())
                                .then(data => {
                                    if (data.success) {
                                        fetchPostsDashboard();
                                    } else {
                                        alert('Failed to delete post');
                                    }
                                })
                                .catch(error => {
                                    console.error('Error deleting post:', error);
                                });
                        }
                    });
                });
            })
            .catch(error => {
                console.error('Error fetching posts:', error);
            });
    }
    fetchPostsDashboard();
});



//
// MANAGE BRANCHES SECTION
//

document.addEventListener('DOMContentLoaded', function () {
    const addBranchButton = document.getElementById('add-branch-button');
    const addBranchModal = document.getElementById('add-branch-modal');
    const closeAddBranchModal = document.getElementById('close-add-branch-modal');
    const addBranchForm = document.getElementById('add-branch-form');

    const editBranchModal = document.getElementById('edit-branch-modal');
    const closeEditBranchModal = document.getElementById('close-edit-branch-modal');
    const editBranchForm = document.getElementById('edit-branch-form');

    let editBranchName = null;
    let editEventName = null;

    addBranchButton.addEventListener('click', function () {
        addBranchModal.classList.remove('hidden');
    });

    closeAddBranchModal.addEventListener('click', function () {
        addBranchModal.classList.add('hidden');
    });

    closeEditBranchModal.addEventListener('click', function () {
        editBranchModal.classList.add('hidden');
    });

    addBranchForm.addEventListener('submit', function (event) {
        event.preventDefault();

        const branchData = {
            branch_name: document.getElementById('new-branch-name').value,
            branch_desc: document.getElementById('new-branch-desc').value
        };

        fetch('/api/branches', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(branchData)
        })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    fetchBranches();
                    addBranchModal.classList.add('hidden');
                } else {
                    alert('Failed to add branch');
                }
            })
            .catch(error => {
                console.error('Error adding branch:', error);
            });
    });

    editBranchForm.addEventListener('submit', function (event) {
        event.preventDefault();

        const branchData = {
            branch_name: document.getElementById('edit-branch-name').value,
            branch_desc: document.getElementById('edit-branch-desc').value
        };

        fetch(`/api/branches/${editBranchName}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(branchData)
        })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    fetchBranches();
                    editBranchModal.classList.add('hidden');
                } else {
                    alert('Failed to edit branch');
                }
            })
            .catch(error => {
                console.error('Error editing branch:', error);
            });
    });

    function fetchBranches() {
        fetch('/api/branches')
            .then(response => response.json())
            .then(branches => {
                const branchesTableBody = document.getElementById('branches');
                branchesTableBody.innerHTML = ''; // Clear existing table content

                branches.forEach(branch => {
                    const row = document.createElement('tr');
                    row.innerHTML = `
                        <td>${branch.branch_name}</td>
                        <td>${branch.branch_desc}</td>
                        <td><button class="edit-button">Edit</button></td>
                        <td><button class="delete-button">Delete</button></td>
                    `;
                    branchesTableBody.appendChild(row);

                    row.querySelector('.edit-button').addEventListener('click', function () {
                        editBranchName = branch.branch_name;
                        console.log('Editing branch with name:', editBranchName); // Debugging
                        document.getElementById('edit-branch-name').value = branch.branch_name;
                        document.getElementById('edit-branch-desc').value = branch.branch_desc;
                        editBranchModal.classList.remove('hidden');
                    });

                    row.querySelector('.delete-button').addEventListener('click', function () {
                        console.log('Deleting branch with name:', branch.branch_name); // Debugging
                        if (confirm('Are you sure you want to delete this branch?')) {
                            fetch(`/api/branches/${branch.branch_name}`, {
                                method: 'DELETE',
                                headers: {
                                    'Content-Type': 'application/json'
                                }
                            })
                                .then(response => response.json())
                                .then(data => {
                                    if (data.success) {
                                        fetchBranches();
                                    } else {
                                        alert('Failed to delete branch');
                                    }
                                })
                                .catch(error => {
                                    console.error('Error deleting branch:', error);
                                });
                        }
                    });
                });
            })
            .catch(error => {
                console.error('Error fetching branches:', error);
            });
    }

    fetchBranches();
});







//
//
// Fetch and display members for viewMember section
document.addEventListener('DOMContentLoaded', function () {

    // Fetch and display members for viewMember section
    function fetchMembers(branchId) {
        fetch(`http://localhost:8080/api/members?branch_id=${branchId}`)
            .then(response => response.json())
            .then(members => {
                const membersTableBody = document.getElementById('members');
                membersTableBody.innerHTML = ''; // Clear existing table content

                // Populate table with member data
                members.forEach(member => {
                    const row = document.createElement('tr');
                    row.innerHTML = `
                        <td>${member.name}</td>
                        <td>${member.role}</td>
                        <td>${member.email}</td>
                    `;
                    membersTableBody.appendChild(row);
                });
            })
            .catch(error => {
                console.error('Error fetching members:', error);
            });
    }

    // function fetchBranches() {
    //     fetch('/api/branches')
    //         .then(response => response.json())
    //         .then(data => {
    //             const branchesTableBody = document.getElementById('branches');
    //             branchesTableBody.innerHTML = '';
    //             data.forEach(branch => {
    //                 const row = document.createElement('tr');
    //                 row.setAttribute('data-branch-id', branch.branch_id);
    //                 row.innerHTML = `
    //                 <td>${branch.branch_name}</td>
    //                 <td>${branch.branch_desc}</td>
    //                 <td><button class="edit-button" data-id="${branch.branch_id}">Edit</button></td>
    //                 <td><button class="delete-button" data-id="${branch.branch_id}">Delete</button></td>
    //             `;
    //                 branchesTableBody.appendChild(row);
    //             });

    //         })
    //         .catch(error => {
    //             console.error('Error fetching branches:', error);
    //         });
    // }
    function fetchCurrentUserBranchId() {
        fetch('http://localhost:8080/api/current_user')
            .then(response => response.json())
            .then(user => {
                const branchId = user.branch_id;
                fetchMembers(branchId);
            })
            .catch(error => {
                console.error('Error fetching user details:', error);
            });
    }

    fetchCurrentUserBranchId();
});

//
// fetch users section
//
document.addEventListener('DOMContentLoaded', function () {
    const addUserButton = document.getElementById('add-user-button');
    const addUserModal = document.getElementById('add-user-modal');
    const closeAddUserModal = document.getElementById('close-add-user-modal');
    const addUserForm = document.getElementById('add-user-form');

    const editUserModal = document.getElementById('edit-user-modal');
    const closeEditUserModal = document.getElementById('close-edit-user-modal');
    const editUserForm = document.getElementById('edit-user-form');

    addUserButton.addEventListener('click', function () {
        addUserModal.classList.remove('hidden');
    });

    closeAddUserModal.addEventListener('click', function () {
        addUserModal.classList.add('hidden');
    });

    closeEditUserModal.addEventListener('click', function () {
        editUserModal.classList.add('hidden');
    });

    addUserForm.addEventListener('submit', function (event) {
        event.preventDefault();

        const userData = {
            first_name: document.getElementById('new-first-name').value,
            last_name: document.getElementById('new-last-name').value,
            username: document.getElementById('new-username').value,
            pass_word: document.getElementById('new-password').value,
            email_address: document.getElementById('new-email-address').value,
            role_permission: document.getElementById('new-role-permission').value,
            email_notifications: document.getElementById('new-email-notifications').checked,
            phone_number: document.getElementById('new-phone-number').value,
            branch_name: document.getElementById('new-branch-id').value // Note the change here
        };

        fetch('/api/users', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(userData)
        })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    fetchUsers();
                    addUserModal.classList.add('hidden');
                } else {
                    alert('Failed to add user');
                }
            })
            .catch(error => {
                console.error('Error adding user:', error);
            });
    });

    editUserForm.addEventListener('submit', function (event) {
        event.preventDefault();

        const userId = document.getElementById('edit-user-id').value;
        const userData = {
            first_name: document.getElementById('edit-first-name').value,
            last_name: document.getElementById('edit-last-name').value,
            username: document.getElementById('edit-username').value,
            email_address: document.getElementById('edit-email-address').value,
            role_permission: document.getElementById('edit-role-permission').value,
            email_notifications: document.getElementById('edit-email-notifications').checked,
            phone_number: document.getElementById('edit-phone-number').value,
            branch_name: document.getElementById('edit-branch-id').value // Note the change here
        };

        fetch(`/api/users/${userId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(userData)
        })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    fetchUsers();
                    editUserModal.classList.add('hidden');
                } else {
                    alert('Failed to edit user');
                }
            })
            .catch(error => {
                console.error('Error editing user:', error);
            });
    });

    function fetchUsers() {
        fetch('/api/users')
            .then(response => response.json())
            .then(users => {
                const usersTableBody = document.getElementById('users');
                usersTableBody.innerHTML = ''; // Clear existing table content

                users.forEach(user => {
                    const row = document.createElement('tr');
                    row.innerHTML = `
                        <td>${user.first_name} ${user.last_name}</td>
                        <td>${user.role_permission}</td>
                        <td>${user.email_address}</td>
                        <td>${user.branch_name}</td>
                        <td><button class="edit-button" data-id="${user.user_id}">Edit</button></td>
                        <td><button class="delete-button" data-id="${user.user_id}">Delete</button></td>
                    `;
                    usersTableBody.appendChild(row);

                    row.querySelector('.edit-button').addEventListener('click', function () {
                        const userId = this.getAttribute('data-id');
                        const user = users.find(u => u.user_id == userId);
                        document.getElementById('edit-user-id').value = user.user_id;
                        document.getElementById('edit-first-name').value = user.first_name;
                        document.getElementById('edit-last-name').value = user.last_name;
                        document.getElementById('edit-username').value = user.username;
                        document.getElementById('edit-email-address').value = user.email_address;
                        document.getElementById('edit-role-permission').value = user.role_permission;
                        document.getElementById('edit-email-notifications').checked = user.email_notifications;
                        document.getElementById('edit-phone-number').value = user.phone_number;
                        document.getElementById('edit-branch-id').value = user.branch_name; // Note the change here
                        editUserModal.classList.remove('hidden');
                    });

                    row.querySelector('.delete-button').addEventListener('click', function () {
                        const userId = this.getAttribute('data-id');
                        if (confirm('Are you sure you want to delete this user?')) {
                            fetch(`/api/users/${userId}`, {
                                method: 'DELETE',
                                headers: {
                                    'Content-Type': 'application/json'
                                }
                            })
                                .then(response => response.json())
                                .then(data => {
                                    if (data.success) {
                                        fetchUsers();
                                    } else {
                                        alert('Failed to delete user');
                                    }
                                })
                                .catch(error => {
                                    console.error('Error deleting user:', error);
                                });
                        }
                    });
                });
            })
            .catch(error => {
                console.error('Error fetching users:', error);
            });
    }

    fetchUsers();
});


//
// fetch events
//
document.addEventListener('DOMContentLoaded', function () {
    const addEventButton = document.getElementById('add-event-button');
    const addEventModal = document.getElementById('add-event-modal');
    const closeAddEventModal = document.getElementById('close-add-event-modal');
    const addEventForm = document.getElementById('add-event-form');

    addEventButton.addEventListener('click', function () {
        addEventModal.classList.remove('hidden');
    });

    closeAddEventModal.addEventListener('click', function () {
        addEventModal.classList.add('hidden');
    });

    addEventForm.addEventListener('submit', function (event) {
        event.preventDefault();

        const formData = new FormData(addEventForm);
        const eventData = Object.fromEntries(formData.entries());

        fetch('/api/events', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(eventData)
        })
            .then(response => {
                if (!response.ok) {
                    return response.json().then(error => {
                        throw new Error(error.error || 'Failed to add event');
                    });
                }
                return response.json();
            })
            .then(data => {
                if (data.success) {
                    fetchEventsDashboard();
                    addEventModal.classList.add('hidden');
                } else {
                    alert('Failed to add event');
                }
            })
            .catch(error => {
                console.error('Error adding event:', error);
                alert(error.message);
            });
    });

    function fetchEventsDashboard() {
        fetch('/api/events-dashboard')
            .then(response => response.json())
            .then(events => {
                const eventsTableBody = document.getElementById('events');
                eventsTableBody.innerHTML = ''; // Clear existing table content

                events.forEach(event => {
                    const row = document.createElement('tr');
                    row.innerHTML = `
                        <td>${event.event_name}</td>
                        <td>${new Date(event.event_date).toLocaleString()}</td>
                        <td>${event.event_desc}</td>
                        <td>${event.location}</td>
                        <td><button class="edit-button" data-id="${event.event_id}">Edit</button></td>
                        <td><button class="delete-button" data-id="${event.event_id}">Delete</button></td>
                    `;
                    eventsTableBody.appendChild(row);

                    row.querySelector('.edit-button').addEventListener('click', function () {
                        document.getElementById('edit-event-id').value = event.event_id;
                        document.getElementById('edit-event-title').value = event.event_name;
                        document.getElementById('edit-event-date').value = new Date(event.event_date).toISOString().substring(0, 10);
                        document.getElementById('edit-event-desc').value = event.event_desc;
                        // Set other fields...
                        editEventModal.classList.remove('hidden');
                    });

                    row.querySelector('.delete-button').addEventListener('click', function () {
                        if (confirm('Are you sure you want to delete this event?')) {
                            fetch(`/api/events/${event.event_id}`, {
                                method: 'DELETE',
                                headers: {
                                    'Content-Type': 'application/json'
                                }
                            })
                                .then(response => response.json())
                                .then(data => {
                                    if (data.success) {
                                        fetchEventsDashboard();
                                    } else {
                                        alert('Failed to delete event');
                                    }
                                })
                                .catch(error => {
                                    console.error('Error deleting event:', error);
                                });
                        }
                    });
                });
            })
            .catch(error => {
                console.error('Error fetching events:', error);
            });
    }

    fetchEventsDashboard();
});




// for navbar:
$(function () {
    $("#navbar-placeholder").load("navbar.html", function () {
        var current = location.pathname.split("/").slice(-1)[0];
        $('nav ul li a').each(function () {
            if ($(this).attr('href') === current) {
                $(this).addClass('active');
            }
        });
    });
});
