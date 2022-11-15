const cluster = require('cluster');
const numCPUs = require('os').cpus().length;

const service = {
    value: {
        count:0
    }
}

function serviceUpdate(value, cluster){
    console.log(`serviceUpdate ${cluster}`,value);
    service.value = {...value}
}

if (cluster.isMaster) {
    
    for(i=0; i<2;i++){
        cluster.fork();
    }
    
    //console.log(cluster);
    
    cluster.on('fork', (worker) => {
        console.log('fork');
    });
        
    cluster.on('message', (worker, message) => {
        console.log(`message from ${worker.id}`, message);
        serviceUpdate(message, 'master');
    });
        
    let iteration = 0;
    const interval = setInterval(() => {
        //console.log('interval', service);
        Object.values(cluster.workers).forEach(worker => {
        console.log('master send', service.value);
            worker.send(service.value);
        });
        iteration++;
        if(iteration>2){
            clearInterval(interval);
        }
    },450)
      
    setTimeout(() => {
      //console.log(cluster)
      console.log('-----------------------------------')
      //console.log(Object.values(cluster.workers))
      Object.values(cluster.workers).forEach(worker => {
          //console.log(worker)
          worker.kill();
      })
    }, 3000);
      
  cluster.on('exit', (worker, code, signal) => console.log('worker %d died (%s).',worker.process.pid, signal || code));

  cluster.on('disconnect', () => {
      console.log('disconnect cluster')
  });

} else if (cluster.isWorker) {
    const worker = cluster.worker;
    console.log(`Worker ${worker.id}:${process.pid} started`);

    process.on('message', value => {
        serviceUpdate(value, worker.id);
    });
    
    let iteration = 0;
    const interval = setInterval(() => {
        console.log(`worker ${worker.id} send`, service.value);
        worker.send(service.value)
        iteration++;
        if(iteration>2){
            clearInterval(interval)
        }
    },500)
    
    setTimeout(() => {
      cluster.worker.process.disconnect()
    }, 2000)
    
}
