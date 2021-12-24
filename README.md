# chaos-monorepo
Bucket repo for everything related to my Master Thesis. Topic: "impact of Chaos Engineering on reliability of microservices".

A major part of this research was building the chaos engineering platform capable of automating chaos engineering experiments through failure injection. The resulting implementation can be divided into three categories:
• *Test Environment* - consists of leveraging external Pulumi Infrastructure-as-Code automation to create an isolated, cloud-based development environment residing in AWS, which includes the AWS EKS Kubernetes cluster. It also includes installing and configuring the Istio, Kiali and Grafana.
• Dixa Test System - consists of a minimal implementation of the microservice architecture resembling the Dixa core platform, where each microservice is a NodeJS application, following client/server code generation through OpenAPI specifications. The Test System modeled core functionalities of Dixa.
• Dixa Test Platform - consists of several components and APIs allowing chaos engineering experimentation through failure injection with Istio. Additionally, it consists of a minimal implementation of a Kubernetes deployment platform, which was necessary for efficient iteeration during the development.

![1200px-Prometheus_software_logo svg](https://user-images.githubusercontent.com/23533231/147337499-2aa5c18c-8d78-439c-83a2-2c0704dd39b1.png)
