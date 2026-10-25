import { Tabs, TabsList, TabsTrigger, TabsContent } from "./Tabs";

export const BasicTabsExample = {
  size: "md",
  backdrop: "surface",
  title: "Basic Tabs",
  component: () => (
    <Tabs defaultValue="tab1">
      <TabsList>
        <TabsTrigger value="tab1">Account</TabsTrigger>
        <TabsTrigger value="tab2">Settings</TabsTrigger>
        <TabsTrigger value="tab3">Profile</TabsTrigger>
      </TabsList>
      <TabsContent value="tab1">Account settings and preferences</TabsContent>
      <TabsContent value="tab2">System configuration options</TabsContent>
      <TabsContent value="tab3">User profile information</TabsContent>
    </Tabs>
  ),
};

export const LongContentTabsExample = {
  size: "sm",
  backdrop: "surface",
  title: "Tabs with Long Content",
  component: () => (
    <Tabs defaultValue="code">
      <TabsList>
        <TabsTrigger value="code">Code</TabsTrigger>
        <TabsTrigger value="preview">Preview</TabsTrigger>
        <TabsTrigger value="tests">Tests</TabsTrigger>
        <TabsTrigger value="deployment">Deployment</TabsTrigger>
      </TabsList>
      <TabsContent value="code">Source code editor</TabsContent>
      <TabsContent value="preview">Live preview of the application</TabsContent>
      <TabsContent value="tests">Test suite results</TabsContent>
      <TabsContent value="deployment">Deployment configuration</TabsContent>
    </Tabs>
  ),
};

export const DisabledTabExample = {
  size: "md",
  backdrop: "surface",
  title: "Disabled Tab",
  component: () => (
    <Tabs defaultValue="active">
      <TabsList>
        <TabsTrigger value="active">Active</TabsTrigger>
        <TabsTrigger value="pending">Pending</TabsTrigger>
        <TabsTrigger value="completed" disabled>
          Completed
        </TabsTrigger>
      </TabsList>
      <TabsContent value="active">Active items list</TabsContent>
      <TabsContent value="pending">Pending items list</TabsContent>
      <TabsContent value="completed">Completed items list</TabsContent>
    </Tabs>
  ),
};
