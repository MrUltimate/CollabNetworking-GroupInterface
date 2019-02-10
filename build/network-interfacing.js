/* NETWORK INTERFACING
	- prebuilt functions, 1.0

	available functions:
	- loadProfile
		get profile object
	- loadshapes
		get a list of a user's shapes
	- loadshapeContent
		get content of each shape and append

	- loadUsersCentral
		get a list of users from an external source
	- usersProfiles
		use a list of users and return their profile
	- userAndTheirshapes
		use a list of users and return their profile + all their shapes

	- isOwner
		check if you are the site's owner
	- writeshape
		submit a shape interface

*/

/******************************************************************************/

async function loadProfile(archive){
	var profile = await archive.readFile('/profile.json')
	profile = JSON.parse(profile)

	var userInfo = {
		"profile" : profile,
		"archive" : archive
	}

	return userInfo
}

/******************************************************************************/

async function loadshapes(archive){
	var shapes = await archive.readdir('/shapes/', {stat: true});

	var usershapes = {
		"shapes" : shapes,
		"archive" : archive
	}

	return usershapes
}

/******************************************************************************/

async function loadshapeContent(archive, shape){
	var shapeLink = '/shapes/' + shape.name;
	// console.log(shapeLink)
	var shapeContent = await archive.readFile(shapeLink)

	var shapeAndArchive = {
		"shape" : JSON.parse(shapeContent),
		"archive" : archive
	}

	return shapeAndArchive
}

/******************************************************************************/

async function loadUsersCentral(archive, fileName){
	var getUserList = await archive.readFile(fileName);
	getUserList = JSON.parse(getUserList)

	var userList = {
		"users" : getUserList.users,
		"archive" : archive
	}

	return userList;
}

/******************************************************************************/

async function isOwner(archive){
	var pageInfo = await archive.getInfo();
	return pageInfo.isOwner;
}

/******************************************************************************/

function writeshape(archive, shapeSubmission){
	var archive = archive;

	// when someone clicks submit:
	shapeSubmission.addEventListener("submit",function(e) {
  	e.preventDefault(); // avoid default behavior
  	var shapeRecieved = e.target,
  			shapeType = shapeRecieved.elements["type"].value.toString(), //only square, circle, or triangle; we can add more later
  			shapeSize = shapeRecieved.elements["size"].value.toString(),
				shapeX = shapeRecieved.elements["x"].value.toString(),
				shapeY = shapeRecieved.elements["y"].value.toString(),
				shapeColor = shapeRecieved.elements["color"].value.toString(),
  			timestamp = new Date().getTime();

  	// set up object to submit to shape:
  	var shapeContent = {
			"type": shapeType,
		  "size": shapeSize,
		  "x": shapeX,
		  "y": shapeY,
		  "color": shapeColor
  	}

  	// use archive (the DatArchive) to write a file
  	async function shapeFile(archive, shapeContent){
  		await archive.writeFile('/shapes/shape-' + shapeContent.timestamp + '.json', JSON.stringify(shapeContent));
  	}

  	shapeFile(archive, shapeContent)
  	.then(function(event){
  		console.log("shape is posted!")
  	})
  	.catch(function(error){
  		console.log("error\n", error)
  	})
	});
}


/******************************************************************************/
/* RECURSIVE FUNCTIONS BELOW */
/* https://en.wikipedia.org/wiki/Recursion_(computer_science) */
/******************************************************************************/



function usersProfiles(userCounter, userList, profilesContainer){
	// recursive function listing all users
	var userUrl = new DatArchive(userList[userCounter]),
			userAmount = userList.length;

	loadProfile(userUrl)
	.then(function(userInfo){

		profilesContainer.insertAdjacentHTML("beforeend", `
			<li>
				<hr />
				<h2>
					<a href="${userInfo.archive.url}" target="_blank">
						${userInfo.profile.username}
					</a>
				</h2>
				<p>${userInfo.profile.bio}</p>
				<h3>${userInfo.profile.email}</h3>
			</li>
		`)

		if(userCounter < userAmount - 1){
			//foreach appending shapes for this user is over
			userCounter++;
			usersProfiles(userCounter, userList, profilesContainer) // move to next user
		}

	})
	.catch(function(error){
		console.log("error thrown\n", error)
	})
}

/******************************************************************************/

function userAndTheirshapes(userCounter, userList, watchingContainer){
	// get username from dat url
	var userUrl = new DatArchive(userList[userCounter]);
			userAmount = userList.length;

	// load user profile:
	loadProfile(userUrl)
	.then(function(userInfo){
		var userId = "user-" + userInfo.archive.url.replace("dat://", ""); // dynamically generated id to be populated later

		watchingContainer.insertAdjacentHTML("beforeend", `
			<li>
				<hr />
				<h2>
					<a href="${userInfo.archive.url}" target="_blank">
						${userInfo.profile.username}
					</a>
				</h2>
				<p>${userInfo.profile.bio}</p>
				<h3>${userInfo.profile.email}</h3>
				<ul id="${userId}"></ul>
			</li>
		`)

		return userInfo.archive;

	})
	.then(function(userArchive){

		// load shapes of user:
		loadshapes(userArchive)
		.then(function(usershapes){
			// this user's shapes:
			console.log(usershapes)
			var userId = "user-" + usershapes.archive.url.replace("dat://", ""); // dynamically generated id

			var amountOfshapes = usershapes.shapes.length,
					shapeCounter = 0;

			usershapes.shapes.forEach(function(shape){

				loadshapeContent(userUrl, shape)
				.then(function(shapeAndArchive){

					var shape = shapeAndArchive.shape;
					var thisshapeContent = shape.content;

					// rough image replacement:
					var usershapeContainer = document.getElementById(userId) // dynamically generated id
					if(JSON.stringify(shape.content).includes('src=\\"')){
						thisshapeContent = JSON.stringify(thisshapeContent).replace('src=\\"', 'src="' + shapeAndArchive.archive.url + "/");
					}else if(JSON.stringify(shape.content).includes("src=\\'")){
						thisshapeContent = JSON.stringify(thisshapeContent).replace("src=\\'", "src='" + shapeAndArchive.archive.url + "/");
					}

					usershapeContainer.insertAdjacentHTML("beforeend", `
						<li>
							<hr />
							<h2>${shape.title}</h2>
							<h4>${shape.timestamp}</h4>
							<div>${thisshapeContent}</div>
						</li>
					`)

					shapeCounter++;
					// console.log(shapeCounter, amountOfshapes, userCounter, userAmount)
					if(shapeCounter >= amountOfshapes && userCounter < userAmount - 1){
						//foreach appending shapes for this user is over
						userCounter++;
						userAndTheirshapes(userCounter, userList, watchingContainer) // move to next user
					}
				})
			})
		})
		.catch(function(error){
			console.log("error thrown\n", error)
		}) //end of loadshapes.then
	})
	.catch(function(error){
		console.log("error thrown\n", error)
	})
} // end of function
