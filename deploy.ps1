
$ErrorActionPreference = "Stop"

$image = "ccd-microservice-project:web-ci-test"
$deployment = "ccd-web"
$container = "web"

Write-Host "`n[1/5] Checking Minikube..."
minikube status
if ($LASTEXITCODE -ne 0) {
    throw "Minikube is not ready. Deployment stopped."
}

Write-Host "`n[2/5] Checking the built Docker image..."
docker image inspect $image *> $null
if ($LASTEXITCODE -ne 0) {
    throw "Image $image was not found in Docker. Run the Jenkins build first."
}

Write-Host "`n[3/5] Loading image into Minikube..."
minikube image load $image
if ($LASTEXITCODE -ne 0) {
    throw "Image loading failed."
}

Write-Host "`n[4/5] Updating the application deployment..."
kubectl set image "deployment/$deployment" "${container}=$image"
if ($LASTEXITCODE -ne 0) {
    throw "Failed to update the deployment."
}

kubectl rollout status "deployment/$deployment" --timeout=120s
if ($LASTEXITCODE -ne 0) {
    throw "Rollout failed or timed out. Check the deployment before retrying."
}

Write-Host "`n[5/5] Checking deployment health..."
kubectl get deployment $deployment
kubectl get pods

Write-Host "`nDeployment completed. Check the application health endpoint next."
