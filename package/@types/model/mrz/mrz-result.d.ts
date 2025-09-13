export type MRZFieldValidationStatus = 'Success' | 'Failure' | 'NotValidated';
export declare class MrzField {
    name?: string;
    value?: string;
    confidence?: number;
    validated?: MRZFieldValidationStatus;
    constructor(name?: string, value?: string, confidence?: number, validated?: MRZFieldValidationStatus);
}
export declare class MrzCheckDigits {
    general?: MrzField;
    documentNumber?: MrzField;
    birthDate?: MrzField;
    expiryDate?: MrzField;
    personalNumber?: MrzField;
}
export declare class MrzResult {
    documentNumber?: MrzField;
    issuingAuthority?: MrzField;
    departmentOfIssuance?: MrzField;
    givenNames?: MrzField;
    surname?: MrzField;
    nationality?: MrzField;
    birthDate?: MrzField;
    gender?: MrzField;
    expiryDate?: MrzField;
    personalNumber?: MrzField;
    travelDocType?: MrzField;
    travelDocTypeVariant?: MrzField;
    optional1?: MrzField;
    optional2?: MrzField;
    discreetIssuingStateOrOrganization?: MrzField;
    kindOfDocumentField?: MrzField;
    documentType?: MrzField;
    format?: MrzField;
    pinCode?: MrzField;
    languageCode?: MrzField;
    versionNumber?: MrzField;
    checkDigits?: MrzCheckDigits;
    verificationSuccessful?: boolean;
    static fromWorker(inputs: any): MrzResult;
}
