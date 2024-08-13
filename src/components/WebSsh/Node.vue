<template>
    <div class="flex">
       <el-form
           label-width="100px"
           class="demo-ruleForm"
           label-position="left"
       >
           <el-form-item label="Ip address" prop="ipaddress" required>
           <el-input type="text" v-model="ruleForm.ipaddress"></el-input>
           </el-form-item>
           <el-form-item label="Username" prop="username" required>
           <el-input type="text" v-model="ruleForm.username"></el-input>
           </el-form-item>
           <el-form-item label="Password" prop="pass" required>
           <el-input type="password" v-model="ruleForm.password" autocomplete="off"></el-input>
           </el-form-item>
           <el-form-item label="Port" prop="port" required>
           <el-input v-model.number="ruleForm.port"></el-input>
           </el-form-item>
           <el-form-item>
           <el-button type="primary" @click="connectSsh" plain>Connect</el-button>
           <el-button @click="resetForm">Reset</el-button>
           </el-form-item>
       </el-form>
   </div>
 </template>
 
 <script lang="ts" setup>
 import { ref } from 'vue'
 import { useRouter } from 'vue-router';
 
 const router = useRouter();

 const ruleForm = ref({
   ipaddress: "",
   username: "root",
   password: "",
   port: 22
 })

 const connectSsh = () => {

   router.push({
       path: "/dial",
       query: {ipaddress: ruleForm.value.ipaddress, username: ruleForm.value.username, password: ruleForm.value.password, port: ruleForm.value.port}
   })
}

const resetForm = () => {
 ruleForm.value.ipaddress = ""
 ruleForm.value.username = ""
 ruleForm.value.password = ""
}

 </script>

<style lang="scss" scoped>
.flex {
   margin-left: 40px;
}
</style>

