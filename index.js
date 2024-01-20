const sharp = require("sharp");


const path = 'input/supernova_2.png'

image = sharp(path)

async function checkRules(image) {
    let metadata = await image.metadata()

    if(metadata.format != "png") {
        console.log(`Image format is not png, actual format: ${metadata.format}`)
    }
    
    if(metadata.width != 512 || metadata.height != 512) {
        console.log(`Avatar's size is not 512px/512px, actual size: ${metadata.width}px/${metadata.height}px`)
    }

    circleShape = Buffer.from(`<svg><circle cx="256" cy="256" r="256"/></svg>`);
    let badgedImage = await image
    .composite([{
        input: circleShape,
        blend: 'dest-in',
    }])
    .raw()
    .toBuffer()

    let imageBuffer = await image.raw().toBuffer()
    if(!imageBuffer.equals(badgedImage)) {
        console.log('Avatar is not a circle surrounded by transparent pixels')
    }

    const stats = await image.stats()
    if((stats.channels[0].mean + stats.channels[1].mean + stats.channels[2].mean)/3 < 100) {
        console.log("Avatar's colors seems dark")
    }
}

(async () => {
    await checkRules(image);
})();