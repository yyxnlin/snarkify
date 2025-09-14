import { Snap3D } from "Remote Service Gateway.lspkg/HostedSnap/Snap3D";
import { Snap3DTypes } from "Remote Service Gateway.lspkg/HostedSnap/Snap3DTypes";
import { Snap3DInteractable } from "./Snap3DInteractable";

@component
export class HeadAttached3DFactory extends BaseScriptComponent {
  @input
  snap3DInteractablePrefab: ObjectPrefab;

  private avaliableToRequest: boolean = true;

  createHeadAttached3DObject(input: string): Promise<string> {
    return new Promise((resolve, reject) => {
      if (!this.avaliableToRequest) {
        print("❌ Already processing a request. Please wait.");
        return;
      }
      
      print("🚀 STARTING HEAD-ATTACHED 3D GENERATION: " + input);
      this.avaliableToRequest = false;

      // Create Head Binding object as per Snap documentation
      let headBinding = this.sceneObject.createChild("Head Binding - " + input);
      
      // Add Head Binding component
      let headBindingComponent = headBinding.createComponent("Component.HeadBinding");
      headBindingComponent.faceIndex = 0; // First face
      headBindingComponent.attachmentPointType = "HeadCenter"; // Center of face
      
      print("📍 HEAD BINDING CREATED: AttachmentPointType.HeadCenter");

      // Create the 3D object under the head binding
      let outputObj = this.snap3DInteractablePrefab.instantiate(headBinding);
      outputObj.name = "HeadAttached3D - " + input;
      
      let snap3DInteractable = outputObj.getComponent(Snap3DInteractable.getTypeName());
      snap3DInteractable.setPrompt(input);

      print("📦 SUBMITTING TO SNAP3D API: " + input);

      Snap3D.submitAndGetStatus({
        prompt: input,
        format: "glb",
        refine: true,
        use_vertex_color: false,
      })
        .then((submitGetStatusResults) => {
          print("✅ SNAP3D API RESPONSE RECEIVED");
          
          submitGetStatusResults.event.add(([value, assetOrError]) => {
            print("🔄 SNAP3D PROCESSING STATUS: " + value);
            
            if (value === "image") {
              assetOrError = assetOrError as Snap3DTypes.TextureAssetData;
              snap3DInteractable.setImage(assetOrError.texture);
              print("🖼️ IMAGE PREVIEW SET");
            } else if (value === "base_mesh") {
              assetOrError = assetOrError as Snap3DTypes.GltfAssetData;
              snap3DInteractable.setModel(assetOrError.gltfAsset, false);
              print("🎯 BASE MESH LOADED");
            } else if (value === "refined_mesh") {
              assetOrError = assetOrError as Snap3DTypes.GltfAssetData;
              snap3DInteractable.setModel(assetOrError.gltfAsset, true);
              this.avaliableToRequest = true;
              print("✨ REFINED MESH COMPLETE - HEAD ATTACHED 3D MODEL READY!");
              resolve("Successfully created head-attached mesh: " + input);
            } else if (value === "failed") {
              assetOrError = assetOrError as Snap3DTypes.ErrorData;
              print("❌ SNAP3D FAILED: " + assetOrError.errorMsg);
              this.avaliableToRequest = true;
              reject("Failed to create head-attached mesh: " + input + " - " + assetOrError.errorMsg);
            }
          });
        })
        .catch((error) => {
          snap3DInteractable.onFailure(error);
          print("❌ ERROR SUBMITTING TO SNAP3D: " + error);
          this.avaliableToRequest = true;
          reject("Failed to create head-attached mesh: " + input + " - " + error);
        });
    });
  }
}
