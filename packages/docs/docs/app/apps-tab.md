# The `Apps` Tab

The Afiax Admin App allows for easy integration of workflows and third-party applications using the `Apps` tab. The `Apps` tab is primarily an operator and implementer tool for launch points, questionnaires, and app-level workflow extensions.

The `Apps` tab is available on the resource page of all resource types. At the moment, it serves `Questionnaire` resources and [SMART App Launch](/docs/integration/smart-app-launch), with room for additional workflow extensions as the platform evolves.

## Navigating to the `Apps` Tab

To get to the `Apps` tab of, for example, a patient, go to the `Patient` resource page by clicking `Patient` in the left sidebar or navigating to `https://app.afiax.africa/Patient`.

Select the patient you would like to view to go to their resource page. From here, select the `Apps` tab from the array of tabs at the top of the page. 

![Apps Tab](apps-tab.png)

Alternatively, you can navigate directly to this page at `https://app.afiax.africa/Patient/:id/apps`.

## Questionnaires

The `Apps` tab of a resource will display all `Questionnaire` resources that are assigned to that `ResourceType` by the `Questionnaire.subjectType` field. For example, a `Patient` page will display all `Questionnaire` resources that are applicable to patients. 

This can streamline workflows and make it easier for users to find any forms or surveys they may need to complete.

## SMART App Launch

SMART App Launch allows you to launch third-party apps from within the Afiax Admin App while maintaining access to authorized data. This is currently available on the `Apps` tab of `Patient` and `Encounter` resource pages.

When you launch an app from a `Patient` page using SMART, the app will have access to that patient's data. The specific data that the new app has access to can be configured so that only certain data is authorized to be shared. This provides a controlled way to extend the Afiax platform with additional tools without moving the source record out of the platform.

If you have set up an app with SMART, but do not see it in the `Apps` tab, it may not be configured correctly. For details on setup and configuration, see the [SMART App Launch Integration docs](/docs/integration/smart-app-launch).
