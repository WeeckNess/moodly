import type { Schema, Struct } from '@strapi/strapi';

export interface SupportContact extends Struct.ComponentSchema {
  collectionName: 'components_support_contacts';
  info: {
    displayName: 'Contact d\u2019accompagnement';
  };
  attributes: {
    bookingUrl: Schema.Attribute.String;
    details: Schema.Attribute.Text;
    email: Schema.Attribute.Email;
    kind: Schema.Attribute.Enumeration<
      ['psychologue', 'prevention', 'manager', 'autre']
    > &
      Schema.Attribute.Required;
    name: Schema.Attribute.String & Schema.Attribute.Required;
    phone: Schema.Attribute.String;
    qualification: Schema.Attribute.String;
  };
}

declare module '@strapi/strapi' {
  export namespace Public {
    export interface ComponentSchemas {
      'support.contact': SupportContact;
    }
  }
}
