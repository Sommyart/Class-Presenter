import React, { useState } from "react";
import { AutoComplete, type Option } from "./AutoComplete";
import { User, Mail, Package } from "lucide-react";

// Sample product data
const products = [
  {
    id: "1",
    name: "Mechanical Keyboard",
    category: "Electronics",
    price: 149.99,
  },
  { id: "2", name: "Ergonomic Mouse", category: "Electronics", price: 79.99 },
  { id: "3", name: '27" Monitor', category: "Electronics", price: 299.99 },
  { id: "4", name: "Laptop Stand", category: "Accessories", price: 49.99 },
];

// Sample user data
const users = [
  {
    id: "1",
    name: "Sarah Wilson",
    email: "sarah@example.com",
    role: "Designer",
  },
  { id: "2", name: "Mike Chen", email: "mike@example.com", role: "Developer" },
  { id: "3", name: "Emma Davis", email: "emma@example.com", role: "Manager" },
  { id: "4", name: "James Lee", email: "james@example.com", role: "Developer" },
];

export const StrictVsFreeform = {
  size: "lg",
  backdrop: "surface",
  title: "Strict Selection vs Free-form Input",
  component: () => {
    const [strictSelected, setStrictSelected] = useState<Option>();
    const [strictInput, setStrictInput] = useState("");
    const [freeformSelected, setFreeformSelected] = useState<Option>();
    const [freeformInput, setFreeformInput] = useState("");

    const options: Option[] = [
      { value: "red", label: "Red" },
      { value: "blue", label: "Blue" },
      { value: "green", label: "Green" },
      { value: "yellow", label: "Yellow" },
    ];

    return (
      <div
        style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2rem" }}
      >
        <div>
          <h3
            style={{
              marginBottom: "1rem",
              fontSize: "0.875rem",
              color: "var(--muted-foreground)",
            }}
          >
            Strict Selection (allowFreeForm=false)
          </h3>
          <AutoComplete
            options={options}
            value={strictSelected}
            onValueChange={setStrictSelected}
            inputValue={strictInput}
            onInputValueChange={setStrictInput}
            placeholder="Select a color..."
            emptyMessage="No colors found"
            allowFreeForm={false}
          />
          <div style={{ marginTop: "0.5rem", fontSize: "0.875rem" }}>
            Input value: "{strictInput}"
          </div>
        </div>

        <div>
          <h3
            style={{
              marginBottom: "1rem",
              fontSize: "0.875rem",
              color: "var(--muted-foreground)",
            }}
          >
            Free-form Input (allowFreeForm=true)
          </h3>
          <AutoComplete
            options={options}
            value={freeformSelected}
            onValueChange={setFreeformSelected}
            inputValue={freeformInput}
            onInputValueChange={setFreeformInput}
            placeholder="Type any color..."
            emptyMessage="No colors found"
            allowFreeForm={true}
          />
          <div style={{ marginTop: "0.5rem", fontSize: "0.875rem" }}>
            Input value: "{freeformInput}"
          </div>
        </div>
      </div>
    );
  },
};

export const UserSearchFreeform = {
  size: "lg",
  backdrop: "surface",
  title: "User Search with Free-form Input",
  component: () => {
    const [selected, setSelected] = useState<Option>();
    const [inputValue, setInputValue] = useState("");

    const userOptions: Option[] = users.map((user) => ({
      value: user.id,
      label: (
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <User size={16} />
          <div>
            <div style={{ fontWeight: "500" }}>{user.name}</div>
            <div
              style={{
                fontSize: "0.75rem",
                color: "var(--muted-foreground)",
                display: "flex",
                alignItems: "center",
                gap: "0.25rem",
              }}
            >
              <Mail size={12} />
              {user.email} • {user.role}
            </div>
          </div>
        </div>
      ),
      displayText: user.name,
      metadata: user,
    }));

    return (
      <div style={{ width: "400px" }}>
        <AutoComplete
          options={userOptions}
          value={selected}
          onValueChange={setSelected}
          inputValue={inputValue}
          onInputValueChange={setInputValue}
          placeholder="Search users or enter a name..."
          emptyMessage="No users found"
          allowFreeForm={true}
        />
        <div style={{ marginTop: "1rem", fontSize: "0.875rem" }}>
          <div>Current input: {inputValue}</div>
          {selected && (
            <div style={{ marginTop: "0.5rem" }}>
              Selected user: {selected.metadata.name} ({selected.metadata.role})
            </div>
          )}
        </div>
      </div>
    );
  },
};

export const ProductSearchFreeform = {
  size: "lg",
  backdrop: "surface",
  title: "Product Search with Free-form Input",
  component: () => {
    const [selected, setSelected] = useState<Option>();
    const [inputValue, setInputValue] = useState("");

    const productOptions: Option[] = products.map((product) => ({
      value: product.id,
      label: (
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <Package size={16} />
          <div>
            <div style={{ fontWeight: "500" }}>{product.name}</div>
            <div
              style={{ fontSize: "0.75rem", color: "var(--muted-foreground)" }}
            >
              {product.category} • ${product.price}
            </div>
          </div>
        </div>
      ),
      displayText: product.name,
      metadata: product,
    }));

    return (
      <div style={{ width: "400px" }}>
        <AutoComplete
          options={productOptions}
          value={selected}
          onValueChange={setSelected}
          inputValue={inputValue}
          onInputValueChange={setInputValue}
          placeholder="Search products or enter item..."
          emptyMessage="No products found"
          allowFreeForm={true}
        />
        <div style={{ marginTop: "1rem", fontSize: "0.875rem" }}>
          <div>Current input: {inputValue}</div>
          {selected && (
            <div style={{ marginTop: "0.5rem" }}>
              Selected product: {selected.metadata.name} ($
              {selected.metadata.price})
            </div>
          )}
        </div>
      </div>
    );
  },
};
