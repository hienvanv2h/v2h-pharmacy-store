"use client";
import { CldUploadWidget } from "next-cloudinary";

export default function ImageUpload({
  onSuccess,
  onError,
}: {
  onSuccess: (result: any) => void;
  onError: (error: any) => void;
}) {
  return (
    <div className="flex justify-center">
      <CldUploadWidget
        signatureEndpoint={"/api/cloudinary-image-upload"}
        uploadPreset={"v2h-pharmacy-preset"}
        options={{
          folder: "product_images",
        }}
        onSuccess={onSuccess}
        onError={onError}
      >
        {({ open }) => {
          return <button onClick={() => open()}>Upload an Image</button>;
        }}
      </CldUploadWidget>
    </div>
  );
}
