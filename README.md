
```bash
export ORG_ID=
export PROJECT_ID=
export REPOSITORY=
export CONTAINER=
export REGION=
export OKTA_CLIENT_ID=
export OKTA_CLIENT_SECRET=
export OKTA_ISSUER=

#Create Workforce Pool
gcloud iam workforce-pools create okta-workforce-pool \
--location="global"  \
--organization=$ORG_ID \
--description="Workforce Pool for Okta" \
--display-name="Okta Workforce Pool"

#Create Workforce Provider
gcloud iam workforce-pools providers create-oidc test \
--workforce-pool=okta-workforce-pool \
--web-sso-response-type="code" \
--client-id=$OKTA_CLIENT_ID \
--issuer-uri=$OKTA_ISSUER \
--client-secret-value=$OKTA_CLIENT_SECRET \
--web-sso-assertion-claims-behavior="merge-user-info-over-id-token-claims" \
--attribute-mapping="google.display_name=assertion.name,\
    google.email=assertion.email,\
    google.groups=assertion.groups,\
    google.subject=assertion.email" \
--location=global \
--detailed-audit-logging

#Create and update env_vars.yaml for Cloud Run
cp env_vars_example.yaml  env_vars.yaml

gcloud artifacts repositories create ${REPOSITORY} --location=${REGION} --repository-format=docker --project=$PROJECT_ID 

docker build -t $CONTAINER .

docker tag $CONTAINER $REGION-docker.pkg.dev/$PROJECT_ID/$REPOSITORY/$CONTAINER:latest

docker push $REGION-docker.pkg.dev/$PROJECT_ID/$REPOSITORY/$CONTAINER

#Note if you don't have docker installed, use Cloud Build
gcloud builds submit . \
--project $PROJECT_ID \
--region $REGION \
--substitutions=_CONTAINER=$CONTAINER,_REGION=$REGION,_REPO=$REPOSITORY,_PROJECT_ID=$PROJECT_ID

gcloud run deploy example \
--project $PROJECT_ID \
--region $REGION \
--image $REGION-docker.pkg.dev/$PROJECT_ID/$REPOSITORY/$CONTAINER:latest \
--env-vars-file ./env_vars.yaml
```