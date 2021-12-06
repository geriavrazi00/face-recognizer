<template>
  <div>
    <h2>Face recognizer</h2>

    <div class="row">
      <div class="col-6">
        <div class="spinner-parallel">
          <h3 class="right-margin" for="sourceImg">Source image</h3>
          <clip-loader :loading="sourceLoading" :color="color" :size="size"></clip-loader>
        </div>
        <br>

        <input ref="sourceFileInput" type="file" @input="pickSourceFile('text')" accept="image/*" id="sourceImg">

        <br><br>

        <img :src="`${sourcePreviewImage}`" class="fluidity" v-if="sourcePreviewImage"/>
        <div class="fluidity" v-if="!sourcePreviewImage"></div>
      </div>

      <div class="col-6">
        <div class="spinner-parallel">
          <h3 class="right-margin" for="comparisonImg">Comparison image</h3>
          <clip-loader :loading="comparisonLoading" :color="color" :size="size"></clip-loader>
        </div>
        <br>

        <input ref="comparisonFileInput" type="file" @input="pickComparisonFile" accept="image/*" id="comparisonImg">

        <br><br>

        <img :src="`${comparisonPreviewImage}`" class="fluidity" v-if="comparisonPreviewImage"/>
        <div class="fluidity" v-if="!comparisonPreviewImage"></div>
      </div>
    </div>

    <div class="row">
      <div class="col-12">
        <button class="btn btn-success btn-sm compare" @click="compare()" :disabled="!sourceFaceId || !comparisonFaceId">Compare</button>
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
      resultLoading: false
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
</style>
