const sharp = require("sharp");


function getMeanIntensity(stats) {
    let numberOfChannels = stats.channels.length;
    if(numberOfChannels == 4) {
        numberOfChannels = 3; //ignore alpha channel
    }

    let intensitySum = 0;

    for(let i = 0; i < numberOfChannels; i++) {
        intensitySum += stats.channels[i].mean;
    }

    let meanIntensity = intensitySum / numberOfChannels;
    return meanIntensity;
}

async function checkAvatarInCircle(image) {
    const circleShape = Buffer.from(`<svg><circle cx="256" cy="256" r="256"/></svg>`);
    let badgedImage = await image
    .composite([{
        input: circleShape,
        blend: 'dest-in',
    }])
    .raw()
    .toBuffer();

    let imageBuffer = await image.raw().toBuffer();
    if(!imageBuffer.equals(badgedImage)) {
        return false;
    }

    return true;
}

async function checkRules(path) {
    const image = await sharp(`input/${path}`, { channels: 4 });

    const metadata = await image.metadata();

    let rulesNotRespected = "";

    if(metadata.format != "png") {
        rulesNotRespected += `Image format is not png, actual format: ${metadata.format}\n`;
    }
    
    if(metadata.width != 512 || metadata.height != 512) {
        rulesNotRespected += `Avatar's size is not 512px/512px, actual size: ${metadata.width}px/${metadata.height}px\n`;
    }

    //cannot correctly check if the avatar is in a circle if the image is not png and of correct size
    if(rulesNotRespected == "") {
        const avatarInCircle = checkAvatarInCircle(image)
        if(!avatarInCircle) {
            rulesNotRespected += 'Avatar is not a circle surrounded by transparent pixels\n';
        }
    } else {
        rulesNotRespected += 'Cannot check if the avatar is in a circle\n';
    }

    const stats = await image.stats();
    if(getMeanIntensity(stats) < 100) {
        rulesNotRespected += "Avatar's colors seems dark";
    }

    //if rulesNotRespected is the same as when initialized it means all rules were respected
    if(rulesNotRespected != "") {
        console.log(rulesNotRespected);
        return false
    }

    return true;
}

async function applyRules(path) {
    const circleShape = Buffer.from(`<svg><circle cx="256" cy="256" r="256"/></svg>`);

    const image = await sharp(`input/${path}`, { channels: 4 });

    //reapplying the rules in case they were already respected shouldn't affect the image, except for color correction
    let resizedCompositedImage = await image
      .png() //changing format first to avoid compositing issues with alpha layer
      .resize(512,512) //using cover resizing
      .composite([{
          input: circleShape,
          blend: 'dest-in',
        }]);
    
    //gamma correction wasn't working as intended
    //const stats = await resizedCompositedImage.stats();
    //const meanIntensity = getMeanIntensity(stats);
    //if(meanIntensity < 100) {
    //    const gammaCorrection = Math.min(1.0 + (255 / meanIntensity), 3.0);
    //    console.log(gammaCorrection)
    //    resizedCompositedImage.gamma(1.0).toFile(`output/${path.split('.')[0]}.png`);
    //} else {
    //    resizedCompositedImage.toFile(`output/${path.split('.')[0]}.png`);
    //}

    resizedCompositedImage.toFile(`output/${path.split('.')[0]}.png`);
}

(async () => {
    const path = 'supernova.jpg'

    let respectRules = await checkRules(path);
    if(!respectRules) {
        applyRules(path);
    } else {
        sharp(`input/${path}`).toFile(`output/${path}`);
    }
})();