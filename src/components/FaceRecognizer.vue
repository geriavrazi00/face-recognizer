<template>
  <div>
    <h2>Face recognizer</h2>

    <div class="row">
      <div class="col-6">
        <h3 for="sourceImg">Source image</h3><br>
        <input ref="sourceFileInput" type="file" @input="pickSourceFile" accept="image/*" id="sourceImg">

        <br><br>

        <img :src="`${sourcePreviewImage}`" class="fluidity" v-if="sourcePreviewImage"/>
      </div>

      <div class="col-6">
        <h3 for="comparisonImg">Comparison image</h3><br>
        <input ref="comparisonFileInput" type="file" @input="pickComparisonFile" accept="image/*" id="comparisonImg">

        <br><br>

        <img :src="`${comparisonPreviewImage}`" class="fluidity" v-if="comparisonPreviewImage"/>
      </div>
    </div>
  </div>
<!-- 
    <div class="row">
      <div class="col-6">
        <div class="col-12">
          <input type="file" id="source" ref="file" v-on:change="handleFileUpload()" accept="image/*"/>

          <file-upload id="source" ref="upload" v-model="sourceImage" @input-file="previewSourceImage()"
            @input-filter="inputFilter" accept="image/*" class="btn btn-success btn-sm">
            Upload source image
          </file-upload>
        </div>

        <br>

        <div class="col-12">
          <img id="output" class="fluidity"/>
        </div>
      </div>

      <div class="col-6">
        <div class="col-12">
          <file-upload id="comparison" ref="upload-2" v-model="comparisonImage" @input-file="previewComparisonImage()"
            @input-filter="inputFilter" accept="image/*" class="btn btn-success btn-sm">
            Upload comparison image
          </file-upload>
        </div>

        <div class="col-12">
          <img id="output-2" class="fluidity"/>
        </div>
      </div>
    </div>

    <br><br>

    <div class="row">
      <div class="col-6">
        <button class="btn btn-success btn-sm" @click="compare()">Compare</button>
      </div>
    </div>
  </div> -->
</template>

<script>
export default {
  data () {
    return {
      sourceImage: [],
      comparisonImage: [],
      sourcePreviewImage: null,
      comparisonPreviewImage: null,
      ocpApimSubKey: process.env.VUE_APP_OCP_APIM_SUBSCRIPTION_KEY,
    }
  },
  methods: {
     pickSourceFile () {
      let input = this.$refs.sourceFileInput
      let file = input.files
      if (file && file[0]) {
        let reader = new FileReader
        reader.onload = async e => {
          // let url = URL.createObjectURL(file[0]);
          console.log(file[0]);

          const requestUrl = 'https://pi-facial-recognition.cognitiveservices.azure.com/face/v1.0/detect';
          const params = '?detectionModel=detection_03&returnFaceId=true&returnFaceLandmarks=false';
        
          const query = await fetch(requestUrl + params, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/octet-stream',
              'Ocp-Apim-Subscription-Key': this.ocpApimSubKey
            },
            body: e.target // body data type must match "Content-Type" header
          });
          const data = await query.json();
          console.log(data);

          this.sourcePreviewImage = e.target.result;
        }
        reader.readAsDataURL(file[0])
        this.$emit('input', file[0])
      }
    },

    pickComparisonFile () {
      let input = this.$refs.comparisonFileInput
      let file = input.files
      if (file && file[0]) {
        let reader = new FileReader
        reader.onload = e => {
          console.log(e)
          this.comparisonPreviewImage = e.target.result
        }
        reader.readAsDataURL(file[0])
        this.$emit('input', file[0])
      }
    }
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
  .fluidity {
    max-width: 100%;
    height: 300px;
    width: fit-content;
    -o-object-fit: cover;
    object-fit: contain;
  }
</style>
