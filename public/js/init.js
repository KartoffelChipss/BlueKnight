window.bridge.sendProfile((event, profile) => {
    console.log(profile)
    document.getElementById("userface").src = `https://visage.surgeplay.com/face/512/${profile.id}`;
    document.getElementById("username").innerHTML = profile.name;
})