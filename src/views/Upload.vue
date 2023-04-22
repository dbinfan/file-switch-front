<template>
  <div>
    <el-upload
      class="upload-demo"
      drag
      :auto-upload="true"
      action=""
      multiple
      :limit="10"
      :file-list="fileList"
      :http-request="upload">
      <i class="el-icon-upload"></i>
      <div class="el-upload__text">将文件拖到此处，或<em>点击上传</em></div>
    </el-upload>
  </div>
</template>

<script>
export default {
  name: "Upload",
  data() {
    return {
      fileList: [],
    };
  },
  methods:{
    async upload(param) {
      const file = param.file;
      let chunk = 5 * 1024 * 1024;
      let pageSet=null;
      await this.$api.get("/upload/getTask", {size: file.size, filename: file.name}, function (data) {
        pageSet = data.data.fileInfo.pageSet;
      });
      if(pageSet!=null){
        this.fileList.push(file);
      }else{
        this.fileList.remove(file);
        return -1;
      }
      let pian = Math.floor(file.size/chunk);
      if(file.size%chunk!==0){
        pian++;
      }
      this.uploadTrunk(pian,chunk,file,0);

    },
    async uploadTrunk(pian,chunk,file,floor){
      if(floor>=5){
        this.$message({
          message: file.name+'重试次数过多，上传失败',
          type: 'error'
        });
      }
      for(let i=0;i<pian;i++){
        let start = i*chunk;
        let end = (i+1)*chunk;
        if(end>file.size){
          end = file.size;
        }
        const form = new FormData();
        form.append("file", file.slice(start, end));
        form.append("filename", file.name);
        form.append("index", i);
        await this.$api.file().post("/upload", form, function (data) {
          console.log(data);
        });
      }
      let isOk = false;
      let that = this;
      await this.$api.get("/upload/getFileInfo", {filename: file.name}, function (data) {
        isOk = true;
        if(data.data.status===0){
          that.$message({
            message: file.name+'上传成功',
            type: 'success'
          });
        }else{
          that.$message({
            message: file.name+'上传失败,重试中',
            type: 'error'
          });
          this.uploadTrunk(pian,chunk,file,floor+1);
        }
      });
    }
  }
}
</script>

<style scoped>

</style>
