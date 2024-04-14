kubectl apply -f deployment-main.yaml -n biatec
kubectl delete configmap biatec-scheduler-main-conf -n biatec
kubectl create configmap biatec-scheduler-main-conf --from-file=conf -n biatec
kubectl rollout restart deployment/biatec-scheduler-main-deployment -n biatec
