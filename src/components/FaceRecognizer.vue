<template>
  <div>
    <h2><b>Pi face recognizer</b></h2>

    <br><br>

    <div class="row" style="margin-bottom: 20px;">
      <div class="col-md-6">
        <div class="spinner-parallel">
          <h3 class="right-margin" for="sourceImg">Source image</h3>
          <clip-loader :loading="sourceLoading" :color="uploadColor" :size="size"></clip-loader>
        </div>
        <br>

        <label for="sourceImg" class="custom-file-upload btn-info">
          <font-awesome-icon icon="cloud-upload-alt" /> Upload
        </label>
        <input ref="sourceFileInput" type="file" @input="pickSourceFile('text')" accept="image/*" id="sourceImg">

        <br><br>

        <img :src="`${sourcePreviewImage}`" class="fluidity" v-if="sourcePreviewImage"/>
        <div class="fluidity" v-if="!sourcePreviewImage"></div>
      </div>

      <div class="col-md-6">
        <div class="spinner-parallel">
          <h3 class="right-margin" for="comparisonImg">Comparison image</h3>
          <clip-loader :loading="comparisonLoading" :color="uploadColor" :size="size"></clip-loader>
        </div>
        <br>

        <label for="comparisonImg" class="custom-file-upload btn-info">
          <font-awesome-icon icon="cloud-upload-alt" /> Upload
        </label>
        <input ref="comparisonFileInput" type="file" @input="pickComparisonFile" accept="image/*" id="comparisonImg">

        <br><br>

        <img :src="`${comparisonPreviewImage}`" class="fluidity" v-if="comparisonPreviewImage"/>
        <div class="fluidity" v-if="!comparisonPreviewImage"></div>
      </div>
    </div>

    <div class="row">
      <div class="col-12">
        <button class="btn-success custom-file-upload" @click="compare()" :disabled="!sourceFaceId || !comparisonFaceId">Compare</button>
      </div>

      <br><br>

      <div class="col-12" v-if="resultMessage">
        <label>{{ resultMessage }}</label>
      </div>
      <div class="col-12" v-if="!resultMessage">
        <clip-loader :loading="resultLoading" :color="color" :size="size"></clip-loader>
      </div>
    </div>
  </div>
</template>

<script>
import ClipLoader from 'vue-spinner/src/ClipLoader.vue'

export default {
  data () {
    return {
      sourceImage: [],
      comparisonImage: [],
      sourcePreviewImage: null,
      comparisonPreviewImage: null,
      ocpApimSubKey: process.env.VUE_APP_OCP_APIM_SUBSCRIPTION_KEY,
      sourceFaceId: null,
      comparisonFaceId: null,
      sourceOrigin: 'source',
      comparisonOrigin: 'comparison',
      sourceLoading: false,
      comparisonLoading: false,
      resultMessage: null,
      resultValue: null,
      resultLoading: false,
      uploadColor: '#0dcaf0'
    }
  },
  components: {
    ClipLoader
  },
  methods: {
    async detectFaces(file) {
      const blob = new Blob([file], {type: 'application/octet-stream'});
      const requestUrl = 'https://pi-facial-recognition.cognitiveservices.azure.com/face/v1.0/detect';
      const params = '?detectionModel=detection_03&returnFaceId=true&returnFaceLandmarks=false';
      
      return await fetch(requestUrl + params, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/octet-stream',
          'Ocp-Apim-Subscription-Key': this.ocpApimSubKey
        },
        body: blob // body data type must match "Content-Type" header
      });
    },

    previewAndRetrieveFile(input, origin) {
      if (origin === this.sourceOrigin) {
        this.sourceLoading = true;
      } else if (origin === this.comparisonOrigin) {
        this.comparisonLoading = true;
      }

      let file = input.files;

      if (file && file[0]) {
        let reader = new FileReader;
        reader.onload = async e => {
          // let url = URL.createObjectURL(file[0]);
          const query = await this.detectFaces(file[0]);

          if (query.ok) {
            const data = await query.json();

            if (data.length > 0) {
              if (origin === this.sourceOrigin) {
                this.sourceFaceId = data[0].faceId;
                this.sourcePreviewImage = e.target.result;
              } else if (origin === this.comparisonOrigin) {
                this.comparisonFaceId = data[0].faceId;
                this.comparisonPreviewImage = e.target.result;
              }
            } else {
              this.$swal({
                icon: 'error',
                title: 'Error',
                text: 'No face detected in the ' + origin + ' image!',
              });
            }
          } else {
            const data = await query.json();

            this.$swal({
              icon: 'error',
              title: 'Error',
              text: data.error.message,
            });

            if (origin === this.sourceOrigin) {
              this.sourceFaceId = null;
              this.sourcePreviewImage = null;
            } else if (origin === this.comparisonOrigin) {
              this.comparisonFaceId = null;
              this.comparisonPreviewImage = null;
            }
          }

          if (origin === this.sourceOrigin) {
            this.sourceLoading = false;
          } else if (origin === this.comparisonOrigin) {
            this.comparisonLoading = false;
          }
        }

        reader.readAsDataURL(file[0]);
        this.$emit('input', file[0]);
      } else {
        if (origin === this.sourceOrigin) {
          this.sourceLoading = false;
        } else if (origin === this.comparisonOrigin) {
          this.comparisonLoading = false;
        }
      }
    },

    async pickSourceFile () {
      let input = this.$refs.sourceFileInput;
      await this.previewAndRetrieveFile(input, this.sourceOrigin);
    },

    async pickComparisonFile () {
      let input = this.$refs.comparisonFileInput;
      await this.previewAndRetrieveFile(input, this.comparisonOrigin);
    },

    async compare() {
      this.resultLoading = true;
      this.resultMessage = null;

      if (!this.sourceFaceId || !this.comparisonFaceId) {
        this.$swal({
          icon: 'error',
          title: 'Error',
          text: "Please set both images correctly!",
        });
      } else {
        const requestUrl = 'https://pi-facial-recognition.cognitiveservices.azure.com/face/v1.0/findsimilars';
        let faceIds = [];
        faceIds.push(this.comparisonFaceId);

        const query = await fetch(requestUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Ocp-Apim-Subscription-Key': this.ocpApimSubKey
          },
          body: JSON.stringify({
            faceId: this.sourceFaceId, 
            faceIds: faceIds,
            maxNumOfCandidatesReturned: 10,
            mode: "matchPerson"
          })
        });

        if (query.ok) {
          const data = await query.json();

          if (data.length > 0) {
            this.resultValue = (data[0].confidence * 100).toFixed(2);
          } else {
            this.resultValue = Math.round(0.0);
          }

          this.resultMessage = "The faces are " + this.resultValue + "% similar!";
        } else {
          const data = await query.json();
          this.resultValue = null;
          this.resultMessage = null;

          this.$swal({
            icon: 'error',
            title: 'Error',
            text: data.error.message,
          });
        }

        this.resultLoading = false;
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

  .spinner-parallel {
    display: -webkit-inline-box;
  }

  .right-margin {
    margin-right: 15px;
  }

  .compare:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    pointer-events: all !important;
  }

  input[type="file"] {
    display: none;
  }

  .custom-file-upload {
    display: inline-block;
    padding: 6px 12px;
    cursor: pointer;
    /* background: #37CEB7 0% 0% no-repeat padding-box; */
    box-shadow: 0px 1px 10px #00000029;
    border-radius: 7px;
    font-size: 17px;
    letter-spacing: 0px;
    color: #FFFFFF;
    width: 148px;
    border: transparent;
    transition: all .3s;
  }

  .custom-file-upload:hover {
    box-shadow: 0px 15px 25px -5px rgba(darken(#37CEB7, 40%));
    transform: scale(1.03);
    color: white;
  }

  .custom-file-upload:focus {
    outline: none;
  }

  .custom-file-upload:active {
    box-shadow: 0px 4px 8px rgba(darken(#37CEB7, 30%));
    transform: scale(.95);
  }

  .custom-file-upload:disabled,
  .custom-file-upload[disabled] {
    /* border: 1px solid #999999; */
    background-color: #cccccc;
    color: #FFFFFF;
    transition: unset;
    cursor: not-allowed;
    transform: none;
  }
</style>
