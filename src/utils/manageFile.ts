import { S3Client, CopyObjectCommand, PutObjectCommand, DeleteObjectCommand, ListObjectsV2Command } from "@aws-sdk/client-s3";

const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

export const uploadFile = async ( file: Express.Multer.File, filename: string ): Promise<void> => {
  try {
    const uploadParams = {
      Bucket: process.env.AWS_S3_BUCKET_NAME!,
      Key: filename,
      Body: file.buffer,
      ContentType: file.mimetype || "application/octet-stream",
    };
    console.log("Uploading file to S3:", uploadParams);
    const command = new PutObjectCommand(uploadParams);
    await s3.send(command);
  } catch (error) {
    console.error(({error: "Internal server error",details: error instanceof Error ? error.message : String(error)
    }));
  }
};

export const deleteFile = async (key: string): Promise<void> => {
  try {
    if(key!="") {
      const deleteParams = {
        Bucket: process.env.AWS_S3_BUCKET_NAME!,
        Key: key,
      };
  
      const command = new DeleteObjectCommand(deleteParams);
      await s3.send(command);
    }
  } catch (error) {
    console.error("Error deleting file from S3:", error);
    throw new Error(
      `delete error: ${error instanceof Error ? error.message : String(error)}`
    );
  }
};

export const renameFolder = async (oldFolderName: string, newFolderName: string): Promise<void> => {
  try {
    const listCommand = new ListObjectsV2Command({
      Bucket: process.env.AWS_S3_BUCKET_NAME!,
      Prefix: oldFolderName.endsWith("/") ? oldFolderName : oldFolderName + "/",
    });
    const listedObjects = await s3.send(listCommand);
    if (!listedObjects.Contents || listedObjects.Contents.length === 0) {
      console.error("No objects found in the specified folder.");
      return;
    }
  
    for (const object of listedObjects.Contents) {
      if (!object.Key) {
        continue;
      }
      const newKey = object.Key.replace(
        oldFolderName.endsWith("/") ? oldFolderName : oldFolderName + "/",
        newFolderName.endsWith("/") ? newFolderName : newFolderName + "/"
      );

      await s3.send(
        new CopyObjectCommand({
          Bucket: process.env.AWS_S3_BUCKET_NAME!,
          CopySource: `${process.env.AWS_S3_BUCKET_NAME!}/${object.Key}`,
          Key: newKey,
        })
      );
  
      await s3.send(
        new DeleteObjectCommand({
          Bucket: process.env.AWS_S3_BUCKET_NAME!,
          Key: object.Key,
        })
      );
    }
  } catch (error) {
    console.error("Error renaming folder in S3:", error);
    throw new Error(
      `rename error: ${error instanceof Error ? error.message : String(error)}`
    );
  }
};