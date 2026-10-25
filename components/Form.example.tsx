import * as z from "zod";
import {
  Form,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
  useForm,
} from "./Form";
import { Input } from "./Input";
import { Button } from "./Button";
import { Textarea } from "./Textarea";
import { X, Plus } from "lucide-react";
import { useState, useEffect } from "react";

const formSchema = z.object({
  username: z.string().min(2, {
    message: "Username must be at least 2 characters.",
  }),
  email: z.string().email({
    message: "Please enter a valid email address.",
  }),
  bio: z.string().max(160, {
    message: "Bio must not be longer than 160 characters.",
  }),
});

export const BasicFormExample = {
  size: "md",
  backdrop: "surface",
  title: "Basic Form",
  component: () => {
    // no need to provide the generic type - just infer from the schema directly.
    const form = useForm({
      defaultValues: {
        username: "",
        email: "",
        bio: "",
      },
      schema: formSchema,
    });

    function onSubmit(values: z.infer<typeof formSchema>) {
      console.log(values);
    }

    const [prefilledPerson, setPrefilledPerson] = useState<string | null>(null);

    const setValues = form.setValues;

    useEffect(() => {
      if (prefilledPerson === "alice") {
        setValues({
          username: "alice",
          email: "alice@example.com",
          bio: "Hi my name is Alice",
        });
      } else if (prefilledPerson === "bob") {
        setValues({
          username: "bob",
          email: "bob@example.com",
          bio: "Hi my name is Bob",
        });
      }
      // Note: when trying to set the form value in useEffect,
      // use setValue as the dependency and not form, otherwise
      // we will run into an infinite loop since form is updated when
      // value is set
    }, [prefilledPerson, setValues]);

    return (
      <Form {...form}>
        <Button
          variant={prefilledPerson === "alice" ? "primary" : "outline"}
          onClick={() => setPrefilledPerson("alice")}
        >
          Alice
        </Button>
        <Button
          variant={prefilledPerson === "bob" ? "primary" : "outline"}
          onClick={() => setPrefilledPerson("bob")}
        >
          Bob
        </Button>
        <form onSubmit={form.handleSubmit(onSubmit)} style={{ width: "100%" }}>
          <FormItem name="username">
            <FormLabel>Username</FormLabel>
            <FormControl>
              <Input
                placeholder="Enter username"
                value={form.values.username}
                onChange={(e) => {
                  form.setValues((prev) => ({
                    ...prev,
                    username: e.target.value,
                  }));
                }}
              />
            </FormControl>
            <FormDescription>This is your public display name.</FormDescription>
            <FormMessage />
          </FormItem>
          <FormItem name="email">
            <FormLabel>Email</FormLabel>
            <FormControl>
              <Input
                type="email"
                placeholder="Enter email"
                value={form.values.email}
                onChange={(e) =>
                  form.setValues((prev) => ({ ...prev, email: e.target.value }))
                }
              />
            </FormControl>
            <FormMessage />
          </FormItem>
          <FormItem name="bio">
            <FormLabel>Bio</FormLabel>
            <FormControl>
              <Textarea
                placeholder="Tell us about yourself"
                value={form.values.bio}
                onChange={(e) => {
                  form.setValues((prev) => ({ ...prev, bio: e.target.value }));
                }}
              />
            </FormControl>
            <FormDescription>
              Brief description for your profile. Max 160 characters.
            </FormDescription>
            <FormMessage />
          </FormItem>
          <Button type="submit" style={{ marginTop: "var(--spacing-4)" }}>
            Submit
          </Button>
        </form>
      </Form>
    );
  },
};

const nestedFormSchema = z.object({
  name: z.string().min(2, { message: "Name is required" }),
  tags: z.array(z.string().min(1, { message: "Tag cannot be empty" })),
  addresses: z
    .array(
      z.object({
        street: z.string().min(1, { message: "Street is required" }),
        city: z.string().min(1, { message: "City is required" }),
        zip: z.string().min(1, { message: "Zip code is required" }),
      }),
    )
    .min(1, "At least one address"),
});

export const NestedFormExample = {
  size: "md",
  backdrop: "surface",
  title: "Nested Form Fields",
  component: () => {
    const form = useForm({
      defaultValues: {
        name: "",
        tags: [""],
        addresses: [{ street: "", city: "", zip: "" }],
      },
      schema: nestedFormSchema,
    });

    function onSubmit(values: z.infer<typeof nestedFormSchema>) {
      console.log(values);
    }

    const addTag = () => {
      form.setValues((prev) => {
        return {
          ...prev,
          tags: [...prev.tags, ""],
        };
      });
    };

    const removeTag = (index: number) => {
      form.setValues((prev) => {
        const updatedTags = [...prev.tags];
        updatedTags.splice(index, 1);
        return {
          ...prev,
          tags: updatedTags,
        };
      });
    };

    const updateTag = (index: number, value: string) => {
      form.setValues((prev) => {
        const updatedTags = [...prev.tags];
        updatedTags[index] = value;
        return {
          ...prev,
          tags: updatedTags,
        };
      });
    };

    const addAddress = () => {
      form.setValues((prev) => {
        return {
          ...prev,
          addresses: [...prev.addresses, { street: "", city: "", zip: "" }],
        };
      });
    };

    const removeAddress = (index: number) => {
      form.setValues((prev) => {
        const updatedAddresses = [...prev.addresses];
        updatedAddresses.splice(index, 1);
        return {
          ...prev,
          addresses: updatedAddresses,
        };
      });
    };

    const updateAddress = (index: number, field: string, value: string) => {
      form.setValues((prev) => {
        const updatedAddresses = [...prev.addresses];
        updatedAddresses[index] = {
          ...updatedAddresses[index],
          [field]: value,
        };
        return {
          ...prev,
          addresses: updatedAddresses,
        };
      });
    };

    return (
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "var(--spacing-4)",
          }}
        >
          <FormItem name="name">
            <FormLabel>Name</FormLabel>
            <FormControl>
              <Input
                placeholder="Enter name"
                value={form.values.name}
                onChange={(e) =>
                  form.setValues((prev) => ({ ...prev, name: e.target.value }))
                }
              />
            </FormControl>
            <FormMessage />
          </FormItem>

          {/* Wrap nested field in FormItem at every level */}
          <FormItem name="tags">
            <FormLabel>Tags</FormLabel>
            {/* Though note that only the user input field should be wrapped in FormControl, not array fields */}
            {form.values.tags.map((tag, index) => (
              <FormItem key={index} name={`tags.${index}`}>
                <div
                  style={{
                    display: "flex",
                    gap: "var(--spacing-2)",
                  }}
                >
                  <FormControl>
                    <Input
                      value={tag}
                      onChange={(e) => updateTag(index, e.target.value)}
                      onBlur={() => form.validateField(`tags.${index}`)}
                      placeholder="Enter tag"
                    />
                  </FormControl>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-md"
                    onClick={() => removeTag(index)}
                    aria-label="Remove tag"
                  >
                    <X size={16} />
                  </Button>
                </div>
                <FormMessage />
              </FormItem>
            ))}
            <Button
              type="button"
              variant="outline"
              onClick={addTag}
              style={{ marginTop: "var(--spacing-1)" }}
            >
              <Plus size={16} /> Add Tag
            </Button>
            {/* Provide FormMessage for nested field at every level so that we capture array level errors like min(1) */}
            <FormMessage />
          </FormItem>

          <FormItem name="addresses">
            <FormLabel>Addresses</FormLabel>
            {form.values.addresses.map((address, index) => (
              <FormItem
                key={index}
                name={`addresses.${index}`}
                style={{
                  border: "1px solid var(--border)",
                  borderRadius: "var(--radius)",
                  padding: "var(--spacing-3)",
                  marginBottom: "var(--spacing-3)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: "var(--spacing-2)",
                  }}
                >
                  <h4 style={{ margin: 0 }}>Address {index + 1}</h4>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => removeAddress(index)}
                    aria-label="Remove address"
                  >
                    <X size={16} />
                  </Button>
                </div>

                <FormItem name={`addresses.${index}.street`}>
                  <FormLabel>Street</FormLabel>
                  <FormControl>
                    <Input
                      value={address.street}
                      onChange={(e) =>
                        updateAddress(index, "street", e.target.value)
                      }
                      onBlur={() =>
                        form.validateField(`addresses.${index}.street`)
                      }
                      placeholder="Enter street"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>

                <div style={{ display: "flex", gap: "var(--spacing-2)" }}>
                  <div style={{ flex: 1 }}>
                    <FormItem name={`addresses.${index}.city`}>
                      <FormLabel>City</FormLabel>
                      <FormControl>
                        <Input
                          value={address.city}
                          onChange={(e) =>
                            updateAddress(index, "city", e.target.value)
                          }
                          onBlur={() =>
                            form.validateField(`addresses.${index}.city`)
                          }
                          placeholder="Enter city"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  </div>
                  <div style={{ width: "30%" }}>
                    <FormItem name={`addresses.${index}.zip`}>
                      <FormLabel>Zip Code</FormLabel>
                      <FormControl>
                        <Input
                          value={address.zip}
                          onChange={(e) =>
                            updateAddress(index, "zip", e.target.value)
                          }
                          onBlur={() =>
                            form.validateField(`addresses.${index}.zip`)
                          }
                          placeholder="Enter zip"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  </div>
                </div>
                <FormMessage />
              </FormItem>
            ))}
            <Button type="button" variant="outline" onClick={addAddress}>
              <Plus size={16} /> Add Address
            </Button>
            <FormMessage />
          </FormItem>

          <Button type="submit" style={{ marginTop: "var(--spacing-4)" }}>
            Submit
          </Button>
        </form>
      </Form>
    );
  },
};
