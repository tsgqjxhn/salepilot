<!-- When permissions are insufficient, return `403`. -->
<template>
    <div class="forbidden-container">
        <h1>403</h1>
        <p class="error-title">Access Forbidden</p>
        <p class="error-desc">You don't have permission to access this page</p>
        <button @click="goBack" class="btn-back">Back to Home</button>
    </div>
</template>

<script>
export default {
    name: "Forbidden",

    methods: {
        goBack() {
            this.$router.push("/");
        },
    },
};
</script>

<style scoped>
.forbidden-container {
    max-width: 600px;
    margin: 100px auto;
    padding: 40px;
    text-align: center;
    border: 1px solid #f56c6c;
    border-radius: 8px;
    background: #fef0f0;
}

h1 {
    font-size: 72px;
    color: #f56c6c;
    margin: 0;
    margin-bottom: 20px;
}

.error-title {
    font-size: 24px;
    color: #606266;
    margin-bottom: 15px;
}

.error-desc {
    color: #909399;
    margin-bottom: 30px;
}

.btn-back {
    padding: 12px 30px;
    background-color: #409eff;
    color: white;
    border: none;
    border-radius: 4px;
    font-size: 16px;
    cursor: pointer;
}

.btn-back:hover {
    background-color: #66b1ff;
}
</style>
