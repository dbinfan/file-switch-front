<template>
  <div>
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
    <div>
      <el-table
        :data="tableData"
        style="width: 700px">
        <el-table-column
          fixed
          prop="filename"
          label="文件名"
          width="auto"
          min-width="min-content"
          show-overflow-tooltip/>
        <el-table-column
          prop="size"
          label="文件大小(KB)"
          width="120px"
          min-width="min-content">
        </el-table-column>
        <el-table-column
          fixed="right"
          label="下载"
          width="70px"
          min-width="70px"
          max-width="70px">
          <template slot-scope="scope">
            <el-button type="success"  icon="el-icon-download" @click="download(scope.row)" circle></el-button>
          </template>
        </el-table-column>

        <el-table-column
          fixed="right"
          label="删除"
          width="70px"
          min-width="70px"
          max-width="70px">
          <template slot-scope="scope">
            <el-button type="danger"  icon="el-icon-delete" @click="del(scope.row)" circle></el-button>
          </template>
        </el-table-column>
        <el-table-column
          fixed="right"
          label="复制"
          width="70px"
          min-width="70px"
          max-width="70px">
          <template slot-scope="scope">
            <el-button type="danger"  icon="el-icon-s-order" @click="copyToClipboard(scope.row)" circle></el-button>
          </template>
        </el-table-column>
      </el-table>

    </div>
    </div>
</template>

<script>
export default {
  name: "Upload",
  data() {
    return {
      fileList: [],
      tableData: [
        {
          filename: '文件名',
          size: 10,
        }
      ],
      // 未完成列表
      unfinishedList: [
        {
          filename: '文件名',
          size: 10,
          // 未完成分片
          unfinishedTrunk: [
            {
              // 分片序号
              index: 1,
              // 分片大小
              size: 10,
              // 分片状态
              status: 0,
            }
          ]
        }
      ],
      visible: false,
    };
  },
  created() {
    this.$api.get("/files/getFileList", {}, function (data) {
      // 获取文件列表
      this.tableData = data.data.fileList;
    }.bind(this));

  },
  methods:{
    async upload(param) {
      const file = param.file;
      let chunk = 5 * 1024 * 1024;
      let pageSet=null;
      await this.$api.get("/upload/getTask", {size: file.size, filename: file.name}, function (data) {
        pageSet = data.data.fileInfo.pageSet;
      });
      let set = new Set();
      if(pageSet!=null){
        set = new Set(pageSet);
        file.ok = "正在上传";
        this.fileList.push(file);
      }
      let pian = Math.floor(file.size/chunk);
      if(file.size%chunk!==0){
        pian++;
      }
      let list = new Array(pian);
      for(let i=0;i<pian;i++){
        if(!set.has(i)) {
          list[i] = false;
        }else{
          list[i] = true;
        }
      }
      let that = this;
      await this.uploadTrunk(pian,chunk,file,0,list,function (){
          that.tableData.push({
            filename: file.name,
            size: file.size,
          });
      });
    },
    async uploadTrunk(pian,chunk,file,floor,list,func){
      if(floor>=5){
        this.$message({
          message: file.name+'重试次数过多，上传失败',
          type: 'error'
        });
      }
      for(let i =0;i<pian;i++){
        if(list[i]===true){
          continue;
        }
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
          for(let i=0;i<that.fileList.length;i++){
            if(that.fileList[i].name===file.name){
              that.fileList[i].ok = "上传成功";
              break;
            }
          }
          func();
        }else{
          that.$message({
            message: file.name+'上传失败,重试中',
            type: 'error'
          });
          let pageSet = data.data.fileInfo.pageSet;
          for(let i=0;i<pian;i++){
            if(!pageSet.has(i)) {
              list[i] = false;
            }else{
              list[i] = true;
            }
          }
          this.uploadTrunk(pian,chunk,file,floor+1);
        }
      });
    },
    download(row){
      var currentDomain = window.location.origin;
      if (this.$api.api.startsWith("http")){
        currentDomain = this.$api.api;
      }else{
        currentDomain = currentDomain+this.$api.api;
      }
      // 要打开的相对链接
      var relativeLink = "/files/download?filename="+row.filename;; // 请替换成你的相对链接

      // 构建完整的链接
      var newURL = currentDomain + relativeLink;
      window.open(newURL, '_blank');
    },
    del(row){
      this.$confirm('此操作将永久删除该文件, 是否继续?', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        let that = this;
        this.$api.get("/files/delFile", {filename: row.filename}, function (data) {
          if (data["status"] === 200) {
            that.$message({
              type: 'success',
              message: '删除成功!'
            });
            let index = that.tableData.indexOf(row); // 找到数字3的索引
            if (index !== -1) {
              that.tableData.splice(index, 1); // 从索引位置删除1个元素
            }
          }
        });
        }
      );
    },
    copyToClipboard(row) {
      var currentDomain = window.location.origin;
      if (this.$api.api.startsWith("http")) {
        currentDomain = this.$api.api;
      } else {
        currentDomain = currentDomain + this.$api.api;
      }
      // 要打开的相对链接
      var relativeLink = "/files/download?filename=" + row.filename;
      // 要复制的预设数据
      const dataToCopy = currentDomain + relativeLink;
      if (window.clipboardData) {
        window.clipboardData.setData('text', dataToCopy);
      }else{
        (function () {
          document.oncopy = function (e) {
            e.clipboardData.setData('text', dataToCopy);
            e.preventDefault();
            document.oncopy = null;
          }
        })('要复制的内容');
        document.execCommand('Copy');
      }
    }
  }
}
</script>

<style scoped>

</style>
