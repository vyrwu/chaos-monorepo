# chaos-monorepo
Bucket repo for everything related to my Master Thesis.
Topic: **"Impact of Chaos Engineering on reliability of microservices"**.

A purpose of this implementation was to build a chaos engineering platform running on top of Istio, capable of scheduling and executing chaos engineering experiments (latency and error rate injection) via simple and easy to understand Restful APIs and UIs. The experiment executions are done in an automatically provisioned canary environment receiving mirrored or split traffic from production, or directly in the production environment. This is a fully functional MVP which can be immediately used by the microservice development teams to orchestrate their chaos experiments. The implementation can be divided into three categories:

- **Test Environment** - consists of leveraging external Pulumi Infrastructure-as-Code automation to create an isolated, cloud-based development environment residing in AWS, which includes the AWS EKS Kubernetes cluster. It also includes installing and configuring the Istio, Kiali and Grafana.
- **Dixa Test System** - consists of a minimal implementation of the microservice architecture resembling the Dixa core platform, where each microservice is a NodeJS application, following a client/server code generation framework through OpenAPI specifications. The Test System modeled core functionalities of Dixa.
- **Dixa Test Platform** - consists of several components and APIs allowing chaos engineering experimentation through failure injection with Istio. Additionally, it consists of a minimal implementation of a Kubernetes deployment platform, which was necessary for efficient iteeration during the development.

![Chaos Engineering - Frame 1](https://user-images.githubusercontent.com/23533231/147337597-3a60cbd0-812e-4f91-ab87-1bc8eb866905.jpg)
