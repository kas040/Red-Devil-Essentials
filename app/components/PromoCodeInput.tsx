import { Modal, TextField, Button, Text, Banner } from "@shopify/polaris";
import { useState } from "react";
import { Form } from "@remix-run/react";

export function PromoCodeInput({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [code, setCode] = useState("");
  
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Voer je promotiecode in"
      primaryAction={{
        content: "Activeer code",
        submit: true,
        form: "promocode-form"
      }}
      secondaryActions={[
        {
          content: "Annuleren",
          onAction: onClose
        }
      ]}
    >
      <Modal.Section>
        <Form id="promocode-form" method="post">
          <input type="hidden" name="action" value="apply_promocode" />
          <TextField
            label="Promotiecode"
            value={code}
            onChange={setCode}
            autoComplete="off"
            name="promocode"
          />
        </Form>
      </Modal.Section>
    </Modal>
  );
}
