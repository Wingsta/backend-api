const util = require("util");
const gc = require("./index");
const bucket = gc.bucket("insta-pilot-beta.appspot.com"); // should be your bucket name

/**
 *
 * @param { File } object file object that will be uploaded
 * @description - This function does the following
 * - It uploads a file to the image bucket on Google Cloud
 * - It accepts an object as an argument with the
 *   "originalname" and "buffer" as keys
 */

export const uploadImage = (file ,company: string,) =>
  new Promise((resolve, reject) => {
    const { originalname, buffer } = file;

    const blob = bucket.file(`${company}/${originalname}`.replace(/ /g, "_"));
    const blobStream = blob.createWriteStream({
      resumable: false,
    });
    blobStream
      .on("finish",async () => {
        let k  =await blob.makePublic()
        console.log(k,"hellpp")
        console.log(
          `https://storage.googleapis.com/${bucket.name}/${blob.name}`
        );
        const publicUrl = (
          `https://storage.googleapis.com/${bucket.name}/${blob.name}`
        );
        resolve(publicUrl);
      })
      .on("error", (error) => {
        console.log(error)
        reject(`Unable to upload image, something went wrong`);
      })
      .end(buffer);
  });



/**
 *
 * @param { File } object file object that will be uploaded
 * @description - This function does the following
 * - It uploads a file to the image bucket on Google Cloud
 * - It accepts an object as an argument with the
 *   "originalname" and "buffer" as keys
 */

export const uploadImageForSocialLink = (file, company: string) =>
  new Promise((resolve, reject) => {
    const { originalname, buffer } = file;

    const blob = bucket.file(`sociallink/${originalname}`.replace(/ /g, "_"));
    const blobStream = blob.createWriteStream({
      resumable: false,
    });
    blobStream
      .on("finish", async () => {
        let k = await blob.makePublic();
        console.log(k, "hellpp");
        console.log(
          `https://storage.googleapis.com/${bucket.name}/${blob.name}`
        );
        const publicUrl = `https://storage.googleapis.com/${bucket.name}/${blob.name}`;
        resolve(publicUrl);
      })
      .on("error", (error) => {
        console.log(error);
        reject(`Unable to upload image, something went wrong`);
      })
      .end(buffer);
  });
